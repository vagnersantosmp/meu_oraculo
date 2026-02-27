/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--bg-background)",
                card: "var(--bg-card)",
                primary: "var(--primary-color)",
                border: "var(--border-color)",
                muted: "var(--bg-muted)",
                "text-primary": "var(--text-primary)",
                "text-secondary": "var(--text-secondary)",
                // Overriding defaults? Or just adding?
                // Let's keep defaults but overwrite specific ones if we used them in standard way.
                // But since I used 'bg-white' in components, I should ideally change components to 'bg-card'
                // OR re-map 'white' to context aware color if I want full auto dark mode without changing class names.
                // However, re-mapping 'white' is dangerous. 
                // Better approach: Add these new colors and I will update components to use 'bg-card' instead of 'bg-white'.
            }
        },
    },
    plugins: [],
}
