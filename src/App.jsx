import { useState } from 'react'
import './App.css'
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from 'react-toastify';

function App() {


  return (
   <><AppRoutes />  <ToastContainer position="top-right" autoClose={5000} /></>
  )
}

export default App
