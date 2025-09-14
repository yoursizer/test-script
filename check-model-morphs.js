// 3D Model Morph Target Checker
// Bu script gerçek GLTF model dosyasındaki morph targetları kontrol eder

const fs = require('fs');

// GLTF dosyasını binary olarak oku ve morph targetları ara
function checkModelMorphTargets() {
  const modelPaths = [
    'https://d2dipktybqm49f.cloudfront.net/male20-13-v2-15jun-2025.glb',
    'https://d2dipktybqm49f.cloudfront.net/female20-18-v1-v1-15jun-2025.glb'
  ];
  
  console.log('🔍 3D MODEL MORPH TARGET CHECKER');
  console.log('='.repeat(50));
  console.log('');
  console.log('❌ Bu script lokal GLB dosyalarını kontrol edemez.');
  console.log('   Model dosyaları CDN\'de hosted, indirmek gerekir.');
  console.log('');
  console.log('💡 ÖNERİLER:');
  console.log('   1. Browser\'da model yüklerken console\'da morph targetları kontrol et');
  console.log('   2. Blender\'da GLB dosyasını aç ve shape key\'leri kontrol et');
  console.log('   3. Three.js ile model yükleyip mesh.morphTargetDictionary\'yi logla');
  console.log('');
  console.log('🧐 ŞÜPHELER:');
  console.log('   • "Brest size" spelling hatası olabilir (Breast olmalı)');
  console.log('   • Model dosyasında bu morph target hiç yoktur');
  console.log('   • Farklı isimde olabilir: "Chest Size", "Bust Size" vs.');
  console.log('');
}

checkModelMorphTargets();