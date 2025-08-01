import fs from 'fs';
import path from 'path';

/**
 * Gets all image files from a specified directory
 * @param directoryPath The path to the directory to scan
 * @returns Array of image file paths
 */
export function getImageFiles(directoryPath: string): string[] {
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
        
        // Return full paths
        return imageFiles.map(file => path.join(directoryPath, file));
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
}
