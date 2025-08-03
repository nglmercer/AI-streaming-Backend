import fs from 'fs';
import { cwd } from 'process';
import path,{ join } from 'path';
import type { BackgroundFile } from '../ws/handler/ws_model.js';
/**
 * Gets all image files from a specified directory
 * @param directoryPath The path to the directory to scan
 * @returns Array of image file paths
 */
const BG_dir = join(cwd(), 'src', 'public', 'bg');

export function getImageFiles(directoryPath: string=BG_dir): BackgroundFile[] {
    try {
        // Supported image extensions
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        
        // Read all files in directory
        const files = fs.readdirSync(directoryPath);
        
        // Filter only image files
        const imageFiles = files.filter(file => {
            const extension = path.extname(file).toLowerCase();
            return imageExtensions.includes(extension);
        });
        
        // full paths imageFiles.map(file => path.join(directoryPath, file)),
        return imageFiles.map(file => {
            return {
                name:file.split('.')[0],
                url:`/bg/${file}`,
            }
        })
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
}
