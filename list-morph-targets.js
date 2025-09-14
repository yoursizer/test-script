// Morph Target Lister Script
// Bu script tüm morph targetları listeleyip konsolda gösterir

const fs = require('fs');
const path = require('path');

// GLTF model dosyalarının yolları
const MODEL_PATHS = {
  male: './public/models/male-body.glb',
  female: './public/models/female-body.glb'
};

// ALLOWED_MORPH_TARGETS constantını oku
function getAllowedMorphTargets() {
  try {
    const constantsPath = './src/constants/sizing-assistant.ts';
    const content = fs.readFileSync(constantsPath, 'utf8');
    
    // ALLOWED_MORPH_TARGETS array'ini bul
    const match = content.match(/ALLOWED_MORPH_TARGETS:\s*string\[\]\s*=\s*\[([\s\S]*?)\];/);
    if (match) {
      const targetsString = match[1];
      const targets = targetsString
        .split(',')
        .map(t => t.trim().replace(/['"]/g, ''))
        .filter(t => t.length > 0 && !t.includes('//'));
      return targets;
    }
  } catch (error) {
    console.error('Error reading ALLOWED_MORPH_TARGETS:', error.message);
  }
  return [];
}

// ALLOWED_HAIR_MORPH_TARGETS constantını oku
function getAllowedHairMorphTargets() {
  try {
    const constantsPath = './src/constants/sizing-assistant.ts';
    const content = fs.readFileSync(constantsPath, 'utf8');
    
    // ALLOWED_HAIR_MORPH_TARGETS array'ini bul
    const match = content.match(/ALLOWED_HAIR_MORPH_TARGETS:\s*string\[\]\s*=\s*\[([\s\S]*?)\];/);
    if (match) {
      const targetsString = match[1];
      const targets = targetsString
        .split(',')
        .map(t => t.trim().replace(/['"]/g, ''))
        .filter(t => t.length > 0 && !t.includes('//'));
      return targets;
    }
  } catch (error) {
    console.error('Error reading ALLOWED_HAIR_MORPH_TARGETS:', error.message);
  }
  return [];
}

// useBodyModel.ts'den morph values'ları oku
function getCurrentMorphValues() {
  try {
    const hookPath = './src/hooks/useBodyModel.ts';
    const content = fs.readFileSync(hookPath, 'utf8');
    
    console.log('\n🔍 useBodyModel.ts içindeki morph target kullanımları:');
    
    // morphTargets.get() çağrılarını bul
    const morphGetMatches = content.match(/morphTargets\.get\(['"`]([^'"`]+)['"`]\)/g);
    if (morphGetMatches) {
      const morphNames = morphGetMatches.map(match => {
        const nameMatch = match.match(/['"`]([^'"`]+)['"`]/);
        return nameMatch ? nameMatch[1] : null;
      }).filter(Boolean);
      
      console.log('   Kullanılan morph targets:', [...new Set(morphNames)]);
    }
    
    // handleMorphChange çağrılarını bul
    const morphChangeMatches = content.match(/handleMorphChange\(['"`]([^'"`]+)['"`]/g);
    if (morphChangeMatches) {
      const morphNames = morphChangeMatches.map(match => {
        const nameMatch = match.match(/['"`]([^'"`]+)['"`]/);
        return nameMatch ? nameMatch[1] : null;
      }).filter(Boolean);
      
      console.log('   handleMorphChange ile kullanılan:', [...new Set(morphNames)]);
    }
    
  } catch (error) {
    console.error('Error reading useBodyModel.ts:', error.message);
  }
}

// Shape keys dosyalarındaki kategorileri oku
function getShapeKeyCategories() {
  const files = [
    './src/components/male-shapekeys.ts',
    './src/components/female-shapekeys.ts'
  ];
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const categories = new Set();
      
      for (let line of lines) {
        if (line.includes(',')) {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const category = parts[0].trim();
            if (category && !category.includes('export') && !category.includes('Category')) {
              categories.add(category);
            }
          }
        }
      }
      
      console.log(`\n📊 ${path.basename(filePath)} kategorileri:`);
      console.log('   ', [...categories].join(', '));
      
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error.message);
    }
  });
}

// Ana fonksiyon
function main() {
  console.log('🎯 MORPH TARGET LISTER');
  console.log('='.repeat(50));
  
  // Constants'dan allowed targets
  const allowedMorphs = getAllowedMorphTargets();
  const allowedHairMorphs = getAllowedHairMorphTargets();
  
  console.log('\n📋 ALLOWED_MORPH_TARGETS (' + allowedMorphs.length + ' adet):');
  allowedMorphs.forEach((target, index) => {
    console.log(`   ${index + 1}. ${target}`);
  });
  
  console.log('\n💇 ALLOWED_HAIR_MORPH_TARGETS (' + allowedHairMorphs.length + ' adet):');
  allowedHairMorphs.forEach((target, index) => {
    console.log(`   ${index + 1}. ${target}`);
  });
  
  // useBodyModel'den kullanımlar
  getCurrentMorphValues();
  
  // Shape keys kategorileri
  getShapeKeyCategories();
  
  // Özet
  console.log('\n📈 ÖZET:');
  console.log(`   • Toplam body morph targets: ${allowedMorphs.length}`);
  console.log(`   • Toplam hair morph targets: ${allowedHairMorphs.length}`);
  console.log(`   • Toplam: ${allowedMorphs.length + allowedHairMorphs.length}`);
  
  // Önemli morph targets
  const importantMorphs = allowedMorphs.filter(m => 
    m.includes('Chest') || m.includes('Waist') || m.includes('Hips') || 
    m.includes('height') || m.includes('overweight')
  );
  
  console.log('\n🔥 ÖNEMLİ MORPH TARGETS:');
  importantMorphs.forEach(target => {
    console.log(`   • ${target}`);
  });
}

// Scripti çalıştır
main();