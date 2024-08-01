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
} from 'firebase/firestore';
import { db } from "./firebase";

export default function Home() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Add item to database
  const addItem = async (e) => {
    e.preventDefault();
    const quantity = parseFloat(newItem.quantity);
    if (newItem.name.trim() !== '' && !isNaN(quantity)) {
      if (quantity === 0) {
        setNewItem({ name: '', quantity: '' });
        return;
      }
      await addDoc(collection(db, 'items'), {
        name: newItem.name.trim(),
        quantity: newItem.quantity,
      });
      setNewItem({ name: '', quantity: '' });
    }
  };

  // Update item in database
  const updateItem = async (e) => {
    e.preventDefault();
    const quantity = parseFloat(editingItem.quantity);
    if (editingItem.name.trim() !== '' && !isNaN(quantity)) {
      if (quantity === 0) {
        await deleteItem(editingItem.id);
        setEditingItem(null);
        return;
      }
      const itemRef = doc(db, 'items', editingItem.id);
      await setDoc(itemRef, {
        name: editingItem.name.trim(),
        quantity: editingItem.quantity,
      });
      setEditingItem(null); // Exit edit mode
    }
  };

  // Read items from database
  useEffect(() => {
    const q = query(collection(db, 'items'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];

      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });

      // Sort items alphabetically by name
      itemsArr.sort((a, b) => a.name.localeCompare(b.name));

      setItems(itemsArr);

      // Read total from itemsArr
      const calculateTotal = () => {
        const totalQuantity = itemsArr.reduce(
          (sum, item) => sum + parseFloat(item.quantity),
          0
        );
        setTotal(totalQuantity);
      };
      calculateTotal();
      return () => unsubscribe();
    });
  }, []);

  // Delete item from database
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, 'items', id));
  };

  // Filter items based on search query
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
                +
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
        </div>
      </div>
    </main>
  );
}
