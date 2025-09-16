import { femaleData } from '../components/female-data';
import { maleData } from '../components/male-data';
import { femaleShapekeys } from '../components/female-shapekeys';
import { maleShapekeys } from '../components/male-shapekeys';

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
        if (values.length >= 5) {
            data.push({
                height: parseFloat(values[0]),
                weight: parseFloat(values[1]),
                chest: parseFloat(values[2]),
                waist: parseFloat(values[3]),
                hips: parseFloat(values[4]),
                inseam: values.length >= 6 ? parseFloat(values[5]) : 0
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
    inseam: number;
}

// Cache parsed data
let femaleDataParsed: DataRow[] | null = null;
let maleDataParsed: DataRow[] | null = null;

// Shape keys interface
export interface ShapeKeys {
    boy: number;
    kilo: number;
    chest: number;
    waist: number;
    hips: number;
}

// Parse shape keys CSV into object
interface ShapeKeyData {
    [category: string]: { [key: string]: number };
}

function parseShapeKeysCSV(csvData: string): ShapeKeyData {
    const lines = csvData.trim().split('\n');
    const result: ShapeKeyData = {};
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const [category, key, value] = lines[i].split(',');
        if (!result[category]) {
            result[category] = {};
        }
        result[category][key] = parseFloat(value);
    }
    
    return result;
}

// Cache shape keys data
let femaleShapeKeysParsed: ShapeKeyData | null = null;
let maleShapeKeysParsed: ShapeKeyData | null = null;

function getShapeValue(data: ShapeKeyData, category: string, value: number): number {
    const dataCategory = data[category];
    if (!dataCategory) return 0;

    const key = value.toString();
    const keyWithDecimal = value.toString() + '.0';

    // 1. Try direct match
    if (dataCategory[key] !== undefined) return dataCategory[key];
    if (dataCategory[keyWithDecimal] !== undefined) return dataCategory[keyWithDecimal];

    // 2. Linear interpolation
    const sortedKeys = Object.keys(dataCategory).map(parseFloat).sort((a, b) => a - b);
    
    if (value < sortedKeys[0]) return dataCategory[sortedKeys[0].toString()];
    if (value > sortedKeys[sortedKeys.length - 1]) return dataCategory[sortedKeys[sortedKeys.length - 1].toString()];

    for (let i = 0; i < sortedKeys.length - 1; i++) {
        if (value >= sortedKeys[i] && value <= sortedKeys[i + 1]) {
            const lowerKey = sortedKeys[i];
            const upperKey = sortedKeys[i + 1];
            const lowerValue = dataCategory[lowerKey.toString()] || dataCategory[lowerKey.toString() + '.0'];
            const upperValue = dataCategory[upperKey.toString()] || dataCategory[upperKey.toString() + '.0'];
            
            if (lowerValue !== undefined && upperValue !== undefined) {
                const t = (upperKey - lowerKey) === 0 ? 0 : (value - lowerKey) / (upperKey - lowerKey);
                return lowerValue + t * (upperValue - lowerValue);
            }
        }
    }

    return 0;
}

export function calculateShapeKeys(height: number, weight: number, chest: number, waist: number, hips: number, gender: string): ShapeKeys {
    // Parse shape keys data with caching
    let shapeData: ShapeKeyData;
    
    if (gender.toLowerCase() === 'female') {
        if (!femaleShapeKeysParsed) {
            femaleShapeKeysParsed = parseShapeKeysCSV(femaleShapekeys);
        }
        shapeData = femaleShapeKeysParsed;
    } else {
        if (!maleShapeKeysParsed) {
            maleShapeKeysParsed = parseShapeKeysCSV(maleShapekeys);
        }
        shapeData = maleShapeKeysParsed;
    }
    
    const roundedHeight = Math.round(height);
    const roundedWeight = Math.round(weight);
    const roundedChest = Math.round(chest);
    const roundedWaist = Math.round(waist);
    const roundedHips = Math.round(hips);
    
    return {
        boy: Math.round(getShapeValue(shapeData, 'boy', roundedHeight) * 1000) / 1000,
        kilo: Math.round(getShapeValue(shapeData, 'kilo', roundedWeight) * 1000) / 1000,
        chest: Math.round(getShapeValue(shapeData, 'chest', roundedChest) * 1000) / 1000,
        waist: Math.round(getShapeValue(shapeData, 'waist', roundedWaist) * 1000) / 1000,
        hips: Math.round(getShapeValue(shapeData, 'hips', roundedHips) * 1000) / 1000
    };
}

export function calculateBodyMeasurements(heightCm: number, weightKg: number, gender: string): BodyMeasurements | null {
    // Convert inputs to integers
    const height = Math.round(heightCm);
    const weight = Math.round(weightKg);
    
    let dataRows: DataRow[] = [];
    
    // Parse data based on gender with caching
    if (gender.toLowerCase() === 'female') {
        if (!femaleDataParsed) {
            femaleDataParsed = parseData(femaleData);
        }
        dataRows = femaleDataParsed;
    } else if (gender.toLowerCase() === 'male') {
        if (!maleDataParsed) {
            maleDataParsed = parseData(maleData);
        }
        dataRows = maleDataParsed;
    } else {
        // Fallback to estimated values for other genders
        const baseChest = (height * 0.53) + (weight * 0.18);
        const baseWaist = (height * 0.42) + (weight * 0.22);
        const baseHips = (height * 0.54) + (weight * 0.26);
        
        return {
            chest: Number(baseChest.toFixed(1)),
            waist: Number(baseWaist.toFixed(1)),
            hips: Number(baseHips.toFixed(1)),
            inseam: Number(((height * 0.45) + (weight * 0.1)).toFixed(1))
        };
    }
    
    // Find the closest match
    const match = findClosestMatch(dataRows, height, weight);
    
    if (match) {
        return {
            chest: match.chest,
            waist: match.waist,
            hips: match.hips,
            inseam: match.inseam
        };
    }

    return null;
}