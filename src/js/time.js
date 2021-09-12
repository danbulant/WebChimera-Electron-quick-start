import { readable } from "svelte/store";

export const time = readable(new Date, (set) => {
    const i = setInterval(() => set(new Date), 300);
    return () => clearInterval(i);
});