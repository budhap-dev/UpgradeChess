import { create } from 'zustand'
interface ToastState { message: string | null; show: (m: string) => void; clear: () => void }
let timer: ReturnType<typeof setTimeout> | undefined
export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => { set({ message }); clearTimeout(timer); timer = setTimeout(() => set({ message: null }), 2200) },
  clear: () => set({ message: null }),
}))
