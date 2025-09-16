import { femaleData } from './feamale-data';
import { maleData } from './male-data';

interface DataRow {
    height: number;
    weight: number;
    chest: number;
    waist: number;
    hips: number;
    inseam: number;
}

// Parse the CSV data
function parseData(csvData: string): DataRow[] {
    const lines = csvData.trim().split('\n');
    const data: DataRow[] = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 6) {
            data.push({
                height: parseFloat(values[0]),
                weight: parseFloat(values[1]),
                chest: parseFloat(values[2]),
                waist: parseFloat(values[3]),
                hips: parseFloat(values[4]),
                inseam: parseFloat(values[5])
            });
        }
    }
    
    return data;
}

// Find the closest match for height and weight
function findClosestMatch(data: DataRow[], targetHeight: number, targetWeight: number): DataRow | null {
    if (data.length === 0) return null;
    
    let closestMatch = data[0];
    let minDistance = Infinity;
    
    for (const row of data) {
        // Calculate distance using both height and weight
        const heightDiff = Math.abs(row.height - targetHeight);
        const weightDiff = Math.abs(row.weight - targetWeight);
        const distance = Math.sqrt(heightDiff * heightDiff + weightDiff * weightDiff);
        
        if (distance < minDistance) {
            minDistance = distance;
            closestMatch = row;
        }
    }
    
    return closestMatch;
}

export interface BodyMeasurements {
    chest: number;
    waist: number;
    hips: number;
}

export function calculateBodyMeasurements(heightCm: number, weightKg: number, gender: string): BodyMeasurements {
    // Convert inputs to integers
    const height = Math.round(heightCm);
    const weight = Math.round(weightKg);
    
    let dataRows: DataRow[] = [];
    
    // Parse data based on gender
    if (gender.toLowerCase() === 'female') {
        dataRows = parseData(femaleData);
    } else if (gender.toLowerCase() === 'male') {
        dataRows = parseData(maleData);
    } else {
        // Fallback to estimated values for other genders
        const baseChest = (height * 0.53) + (weight * 0.18);
        const baseWaist = (height * 0.42) + (weight * 0.22);
        const baseHips = (height * 0.54) + (weight * 0.26);
        
        return {
            chest: Number(baseChest.toFixed(1)),
            waist: Number(baseWaist.toFixed(1)),
            hips: Number(baseHips.toFixed(1))
        };
    }
    
    // Find the closest match
    const match = findClosestMatch(dataRows, height, weight);
    
    if (match) {
        return {
            chest: match.chest,
            waist: match.waist,
            hips: match.hips
        };
    }

    return {
        chest: 0.0,
        waist: 0.0,
        hips: 0.0
    };
    
}