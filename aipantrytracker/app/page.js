'use client';
import Image from "next/image";
import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from "./firebase";
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: "", dangerouslyAllowBrowser: true });

async function suggestRecipe(pantryContents, setRecipe) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Suggest a recipe based on the following pantry contents: ${pantryContents.join(", ")}.`,
        },
      ],
    });
    const recipe = response.choices[0].message.content;
    setRecipe(recipe);
  } catch (error) {
    handleAPIError(error);
  }
}

function handleAPIError(error) {
  if (error.code === 'insufficient_quota') {
    console.error("Error: You have exceeded your API quota. Please check your plan and billing details.");
  } else if (error.code === 'model_not_found') {
    console.error("Error: The model you requested has been deprecated or does not exist. Please use a valid model.");
  } else {
    console.error("Error generating response:", error);
  }
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState('');

  const fetchAndUpdateRecipes = async () => {
    const pantryContents = items.map(item => item.name);
    await suggestRecipe(pantryContents, setRecipe);
  };

  const addItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const quantity = parseFloat(newItem.quantity);
      if (newItem.name.trim() !== '' && !isNaN(quantity)) {
        if (quantity === 0) {
          setNewItem({ name: '', quantity: '' });
          setLoading(false);
          return;
        }

        // Check if item already exists
        const existingItem = items.find(item => item.name.toLowerCase() === newItem.name.trim().toLowerCase());
        if (existingItem) {
          const itemRef = doc(db, 'items', existingItem.id);
          await setDoc(itemRef, {
            name: existingItem.name,
            quantity: parseFloat(existingItem.quantity) + quantity,
          });
        } else {
          await addDoc(collection(db, 'items'), {
            name: newItem.name.trim(),
            quantity: newItem.quantity,
          });
        }

        setNewItem({ name: '', quantity: '' });
        await fetchAndUpdateRecipes();
      }
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const quantity = parseFloat(editingItem.quantity);
      if (editingItem.name.trim() !== '' && !isNaN(quantity)) {
        if (quantity === 0) {
          await deleteItem(editingItem.id);
          setEditingItem(null);
          setLoading(false);
          return;
        }
        const itemRef = doc(db, 'items', editingItem.id);
        await setDoc(itemRef, {
          name: editingItem.name.trim(),
          quantity: editingItem.quantity,
        });
        setEditingItem(null);
        await fetchAndUpdateRecipes();
      }
    } catch (error) {
      console.error("Error updating item:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'items'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];

      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });

      itemsArr.sort((a, b) => a.name.localeCompare(b.name));

      setItems(itemsArr);

      const calculateTotal = () => {
        const totalQuantity = itemsArr.reduce(
          (sum, item) => sum + parseFloat(item.quantity),
          0
        );
        setTotal(totalQuantity);
      };
      calculateTotal();
    });
    return () => unsubscribe();
  }, []);

  const deleteItem = async (id) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'items', id));
      await fetchAndUpdateRecipes();
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex min-h-screen flex-col items-center bg-purple-50 p-6">
      <header className="w-full flex flex-col items-center bg-purple-500 p-4 shadow-md fixed top-0 z-10 rounded-b-lg">
        <h1 className="text-2xl font-bold text-white mb-4">AI Pantry Tracker</h1>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border border-purple-300 rounded-md w-2/3 mb-2"
          placeholder="Search items..."
        />
      </header>
      <div className="mt-28 w-full max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          {editingItem ? (
            <form onSubmit={updateItem} className='grid grid-cols-6 gap-4 mb-4'>
              <input
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className='col-span-3 p-3 border border-purple-300 rounded-md'
                type="text"
                placeholder="Edit Item Name"
              />
              <input
                value={editingItem.quantity}
                onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                className='col-span-2 p-3 border border-purple-300 rounded-md'
                type="number"
                placeholder="Edit Quantity"
              />
              <button type="submit" className='text-white bg-purple-500 hover:bg-purple-600 p-3 rounded-md'>
                Save
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className='ml-4 p-3 border border-purple-300 hover:bg-purple-200 rounded-md'>
                Cancel
              </button>
            </form>
          ) : (
            <form onSubmit={addItem} className='grid grid-cols-6 gap-4 mb-4'>
              <input 
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className='col-span-3 p-3 border border-purple-300 rounded-md' 
                type="text" 
                placeholder="Enter Item" 
              />
              <input 
                value={newItem.quantity}
                onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                className='col-span-2 p-3 border border-purple-300 rounded-md' 
                type="number" 
                placeholder="Enter Quantity" 
              />
              <button 
                className='text-white bg-purple-500 hover:bg-purple-600 p-3 rounded-md' 
                type="submit">
                {loading ? 'Loading...' : '+'}
              </button>
            </form>
          )}
          <ul>
            {filteredItems.map((item, id) => (
              <li key={id} className='my-4 p-4 bg-purple-50 rounded-lg shadow-md flex justify-between items-center'>
                <div className='flex justify-between w-full'>
                  <span className='capitalize text-slate-700'>{item.name}</span>
                  <span className='text-slate-700 mr-8'>{item.quantity}</span>
                </div>
                <div className='flex gap-2'>
                  <button 
                    onClick={() => setEditingItem(item)}
                    className='p-2 bg-purple-300 text-white rounded-md hover:bg-yellow-400'>
                      Edit
                  </button>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className='p-2 bg-slate-300 text-white rounded-md hover:bg-red-400'>
                      Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {filteredItems.length > 0 && (
            <div className='flex justify-between p-3 mt-4 bg-purple-50 rounded-lg shadow-md'> 
              <span className='font-bold text-slate-700'>Total Quantity</span>
              <span className='font-bold text-slate-700'>{total}</span>
            </div>
          )}
          <button 
            onClick={fetchAndUpdateRecipes} 
            className='mt-6 text-white bg-purple-500 hover:bg-purple-600 p-3 rounded-md'>
            Create Recipe
          </button>
          {recipe && (
            <div className='mt-6 p-4 bg-purple-50 rounded-lg shadow-md'>
              <h2 className='text-xl font-bold text-slate-700'>Suggested Recipe:</h2>
              <p className='text-slate-700 mt-2'>{recipe}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

