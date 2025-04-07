import daisyui from 'daisyui';

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontSize: {
                'sm-tablet': '0.875rem', // smaller font size for tablets
            },
            width: {
                'card-tablet': '90%', // increase card width for tablets
            }
        },
    },
    plugins: [
        daisyui,
    ],
};
