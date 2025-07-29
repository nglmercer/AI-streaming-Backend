import { getAllExpressions, getAllMotions } from './model-loader.js';

(async () => {
  const modelName = 'shizuku';

  // Obtener todas las expresiones
  const expressions = await getAllExpressions(modelName);
  console.log('Expressions:', expressions);

  // Obtener todos los movimientos
  const motions = await getAllMotions(modelName);
  console.log('Motions:', motions);

  // Convertir a JSON
  const expressionsJson = JSON.stringify(expressions, null, 2);
  const motionsJson = JSON.stringify(motions, null, 2);

  console.log('Expressions JSON:', expressionsJson);
  console.log('Motions JSON:', motionsJson);


})();