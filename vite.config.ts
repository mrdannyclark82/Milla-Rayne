  import { defineConfig } from 'vite';                                                                        
     import react from '@vitejs/plugin-react';                                                                   
     import path from 'path';                                                                                    
     import { fileURLToPath } from 'url';                                                                        
     import tailwindcss from '@tailwindcss/vite';                                                                
                                                                                                                 
     const __dirname = path.dirname(fileURLToPath(import.meta.url));                                             
                                                                                                                 
     export default defineConfig({                                                                               
       root: 'client',                                                                                           
       plugins: [                                                                                                
         tailwindcss(),                                                                                          
         react(),                                                                                                
       ],                                                                                                        
       resolve: {                                                                                                
         alias: {                                                                                                
           '@': path.resolve(__dirname, 'client', 'src'),                                                        
           '@shared': path.resolve(__dirname, 'shared'),                                                         
           '@assets': path.resolve(__dirname, 'attached_assets'),                                                
         },                                                                                                      
         dedupe: ['react', 'react-dom'],                                                                         
       },                                                                                                        
     });                    
