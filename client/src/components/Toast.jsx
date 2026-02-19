import React, { createContext, useContext, useState } from 'react'

const ToastContext = createContext()
export function useToast(){ return useContext(ToastContext) }

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])
  function push(msg){
    const id = Date.now(); setToasts(t=>[...t, { id, msg }]);
    setTimeout(()=> setToasts(t=>t.filter(x=>x.id!==id)), 4000)
  }
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 space-y-2">
        {toasts.map(t=> <div key={t.id} className="bg-slate-800 text-white p-3 rounded shadow">{t.msg}</div>)}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
