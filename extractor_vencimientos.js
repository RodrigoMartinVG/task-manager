(function extractorUniversalUAI() {
    console.log("🚀 Iniciando extracción de vencimientos...");

    const meses = { 
        "enero":"01", "febrero":"02", "marzo":"03", "abril":"04",
        "mayo":"05", "junio":"06", "julio":"07", "agosto":"08",
        "septiembre":"09", "octubre":"10", "noviembre":"11", "diciembre":"12" 
    };

    // 1. Obtener el nombre de la materia de forma genérica (Blackboard Ultra)
    const tituloLink = document.querySelector('a[data-analytics-id="course.header.course-title.button"]');
    let nombreMateria = "";

    if (tituloLink) {
        const textoCompleto = tituloLink.innerText;
        // Limpiamos el código de comisión para dejar solo el nombre descriptivo
        const partes = textoCompleto.split(' - ');
        nombreMateria = partes.length > 1 ? partes[partes.length - 1].trim() : textoCompleto.trim();
    } else {
        nombreMateria = document.title.split('-')[0].trim() || prompt("No se detectó el nombre. Ingresa la materia:");
    }

    if (!nombreMateria) return;

    // 2. Estructura de datos para la importación incremental
    const exportData = {
        version: 1,
        id_importacion: Date.now(),
        fecha_sincro: new Date().toLocaleString(),
        materia: nombreMateria,
        materiaId: nombreMateria.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        tareas: []
    };

    // 3. Selección de bloques de días y tareas
    const bloquesDias = document.querySelectorAll('.date-container');

    bloquesDias.forEach(dia => {
        const fechaHeader = dia.querySelector('h2, .due-date');
        if (!fechaHeader) return;

        // Extraer "22 de abril de 2026"
        const textoFecha = fechaHeader.innerText.toLowerCase();
        const matchFecha = textoFecha.match(/(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})/);
        
        let fechaISO = "";
        if (matchFecha) {
            fechaISO = `${matchFecha[3]}-${meses[matchFecha[2]]}-${matchFecha[1].padStart(2, '0')}`;
        }

        const contenedorTareas = dia.nextElementSibling;
        if (contenedorTareas && contenedorTareas.classList.contains('due-item-block')) {
            const tarjetas = contenedorTareas.querySelectorAll('.element-card.due-item');

            tarjetas.forEach(tarjeta => {
                const linkTarea = tarjeta.querySelector('a[analytics-id*="openDueDateItem"]');
                const tituloTarea = linkTarea ? linkTarea.innerText.trim() : "Tarea sin título";
                
                const detalle = tarjeta.querySelector('.element-details .content span')?.innerText || "";
                const matchHora = detalle.match(/(\d{1,2}:\d{2})/);

                exportData.tareas.push({
                    titulo: `[${nombreMateria}] ${tituloTarea}`,
                    fechaLimite: fechaISO,
                    hora: matchHora ? matchHora[1] : "23:59",
                    materiaOriginal: nombreMateria,
                    materiaId: exportData.materiaId,
                    completada: false
                });
            });
        }
    });

    // 4. Validación final y envío
    if (exportData.tareas.length === 0) {
        alert("⚠️ No se encontraron tareas. Asegúrate de estar en la vista de 'Vencimientos' del calendario.");
        return;
    }

    try {
        // Codificamos el JSON en Base64 para enviarlo por URL
        const jsonStr = JSON.stringify(exportData);
        const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
        
        const urlDestino = "https://rodrigomartinvg.github.io/task-manager/planner.html";
        const finalURL = `${urlDestino}#import=${b64}`;

        console.log(`✅ Extracción exitosa: ${exportData.tareas.length} tareas de ${nombreMateria}.`);
        console.log("Redirigiendo a tu App...");

        // Abrimos la app en una nueva pestaña
        window.open(finalURL, '_blank');

    } catch (e) {
        console.error("❌ Error al procesar los datos:", e);
        alert("Hubo un error al generar el paquete de exportación.");
    }
})();
