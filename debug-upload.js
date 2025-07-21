// Script de diagnóstico para problemas de subida de archivos
// Ejecutar en la consola del navegador

console.log('🔍 Diagnóstico de subida de archivos - Task-it');

// 1. Verificar autenticación
const checkAuth = async () => {
  const { data: { user } } = await window.supabase.auth.getUser();
  console.log('👤 Usuario autenticado:', user?.id ? '✅ Sí' : '❌ No');
  if (user) {
    console.log('   - ID:', user.id);
    console.log('   - Email:', user.email);
  }
  return user;
};

// 2. Verificar bucket de storage
const checkBucket = async () => {
  try {
    const { data, error } = await window.supabase.storage.listBuckets();
    console.log('🗂️ Buckets disponibles:', data?.map(b => b.name) || []);
    
    const taskBucket = data?.find(b => b.name === 'task-attachments');
    console.log('📁 Bucket task-attachments:', taskBucket ? '✅ Existe' : '❌ No existe');
    
    if (error) console.error('   Error:', error);
  } catch (err) {
    console.error('❌ Error verificando buckets:', err);
  }
};

// 3. Probar subida simple
const testUpload = async (user) => {
  if (!user) return;
  
  try {
    // Crear un archivo de prueba
    const testContent = 'Archivo de prueba para diagnóstico';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    const filePath = `${user.id}/test-task/test-${Date.now()}.txt`;
    console.log('📤 Probando subida a:', filePath);
    
    const { data, error } = await window.supabase.storage
      .from('task-attachments')
      .upload(filePath, testFile);
    
    if (error) {
      console.error('❌ Error en subida:', error);
    } else {
      console.log('✅ Subida exitosa:', data);
      
      // Intentar eliminar el archivo de prueba
      await window.supabase.storage
        .from('task-attachments')
        .remove([filePath]);
      console.log('🗑️ Archivo de prueba eliminado');
    }
  } catch (err) {
    console.error('❌ Error en prueba de subida:', err);
  }
};

// 4. Verificar políticas RLS
const checkPolicies = async () => {
  try {
    const { data, error } = await window.supabase
      .from('task_attachments')
      .select('count')
      .limit(1);
    
    console.log('🔐 Acceso a tabla task_attachments:', error ? '❌ Error' : '✅ OK');
    if (error) console.error('   Error:', error);
  } catch (err) {
    console.error('❌ Error verificando políticas:', err);
  }
};

// Ejecutar diagnóstico completo
const runDiagnostic = async () => {
  console.log('='.repeat(50));
  const user = await checkAuth();
  await checkBucket();
  await checkPolicies();
  await testUpload(user);
  console.log('='.repeat(50));
  console.log('✨ Diagnóstico completado');
};

// Instrucciones
console.log(`
📋 INSTRUCCIONES:
1. Abre las DevTools (F12)
2. Ve a la pestaña Console
3. Pega este código: runDiagnostic()
4. Presiona Enter
5. Revisa los resultados
`);

// Exportar para uso global
window.debugUpload = { runDiagnostic, checkAuth, checkBucket, testUpload, checkPolicies };