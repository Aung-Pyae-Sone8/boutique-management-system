import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
    ],
});

// export const tailwindConfig = {
//     content: [
//         './resources/views/**/*.blade.php',
//         './resources/js/**/*.{js,ts,jsx,tsx,vue}',
//         './resources/css/**/*.css',
//     ],
//     darkMode: 'class',
//     theme: {
//         extend: {
//             colors: {
//                 'surface-dim': '#dadad8',
//                 'primary-fixed-dim': '#c6c6c6',
//                 'surface-tint': '#5e5e5e',
//                 'surface-container-low': '#f4f4f2',
//                 'outline-variant': '#cfc4c5',
//                 outline: '#7e7576',
//                 'on-secondary-fixed': '#1a1c1b',
//                 'on-secondary-container': '#636563',
//                 'on-primary-fixed': '#1b1b1b',
//                 'error-container': '#ffdad6',
//                 secondary: '#5d5f5d',
//                 'on-surface': '#1a1c1b',
//                 'on-secondary-fixed-variant': '#454746',
//                 'surface-container': '#eeeeec',
//                 surface: '#f9f9f7',
//                 'on-error': '#ffffff',
//                 'on-secondary': '#ffffff',
//                 'tertiary-fixed-dim': '#c7c6c6',
//                 'secondary-fixed': '#e2e3e1',
//                 'surface-variant': '#e2e3e1',
//                 'primary-fixed': '#e2e2e2',
//                 'surface-container-lowest': '#ffffff',
//                 'secondary-fixed-dim': '#c6c7c5',
//                 background: '#f9f9f7',
//                 'on-primary-fixed-variant': '#474747',
//                 tertiary: '#000000',
//                 'inverse-on-surface': '#f1f1ef',
//                 'on-tertiary-container': '#848484',
//                 'inverse-primary': '#c6c6c6',
//                 primary: '#000000',
//                 'tertiary-container': '#1b1c1c',
//                 'surface-container-high': '#e8e8e6',
//                 'on-tertiary-fixed-variant': '#464747',
//                 'on-tertiary': '#ffffff',
//                 'surface-bright': '#f9f9f7',
//                 'on-error-container': '#93000a',
//                 'tertiary-fixed': '#e4e2e2',
//                 'on-background': '#1a1c1b',
//                 'on-primary': '#ffffff',
//                 'on-tertiary-fixed': '#1b1c1c',
//                 'inverse-surface': '#2f3130',
//                 error: '#ba1a1a',
//                 'secondary-container': '#e2e3e1',
//                 'on-surface-variant': '#4c4546',
//                 'surface-container-highest': '#e2e3e1',
//                 'primary-container': '#1b1b1b',
//                 'on-primary-container': '#848484',
//             },
//             borderRadius: {
//                 DEFAULT: '0px',
//                 lg: '0px',
//                 xl: '0px',
//                 full: '9999px',
//             },
//             spacing: {
//                 md: '24px',
//                 lg: '40px',
//                 sm: '16px',
//                 gutter: '12px',
//                 'container-margin': '20px',
//                 base: '4px',
//                 xs: '8px',
//                 xl: '64px',
//             },
//             fontFamily: {
//                 'label-caps': ['Hanken Grotesk'],
//                 'body-lg': ['Hanken Grotesk'],
//                 'display-lg-mobile': ['EB Garamond'],
//                 'title-sm': ['Hanken Grotesk'],
//                 'headline-md-mobile': ['EB Garamond'],
//                 'headline-md': ['EB Garamond'],
//                 'display-lg': ['EB Garamond'],
//                 'body-md': ['Hanken Grotesk'],
//             },
//             fontSize: {
//                 'label-caps': [
//                     '12px',
//                     {
//                         lineHeight: '16px',
//                         letterSpacing: '0.1em',
//                         fontWeight: '700',
//                     },
//                 ],
//                 'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
//                 'display-lg-mobile': [
//                     '36px',
//                     {
//                         lineHeight: '40px',
//                         letterSpacing: '-0.01em',
//                         fontWeight: '400',
//                     },
//                 ],
//                 'title-sm': [
//                     '18px',
//                     {
//                         lineHeight: '24px',
//                         letterSpacing: '0.05em',
//                         fontWeight: '600',
//                     },
//                 ],
//                 'headline-md-mobile': [
//                     '24px',
//                     { lineHeight: '28px', fontWeight: '400' },
//                 ],
//                 'headline-md': [
//                     '32px',
//                     { lineHeight: '38px', fontWeight: '400' },
//                 ],
//                 'display-lg': [
//                     '48px',
//                     {
//                         lineHeight: '52px',
//                         letterSpacing: '-0.02em',
//                         fontWeight: '400',
//                     },
//                 ],
//                 'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
//             },
//         },
//     },
//     plugins: [],
// };
