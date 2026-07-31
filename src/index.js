export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // La ruta /api/datos obtiene el JSON de Dropbox.
    if (url.pathname === "/api/datos") {
      return obtenerDatosDropbox(env);
    }

    // El resto de las rutas muestran los archivos de /public.
    return env.ASSETS.fetch(request);
  }
};

async function obtenerDatosDropbox(env) {
  const dropboxUrl = env.DROPBOX_JSON_URL;

  if (!dropboxUrl) {
    return respuestaJson(
      {
        error: "Falta configurar DROPBOX_JSON_URL"
      },
      500
    );
  }

  try {
    const url = new URL(dropboxUrl);

    // Fuerza la descarga directa.
    url.searchParams.set("dl", "1");

    // Evita que Dropbox entregue una versión anterior.
    url.searchParams.set(
      "_",
      Date.now().toString()
    );

    const respuesta = await fetch(
      url.toString(),
      {
        headers: {
          Accept:
            "application/json,text/plain,*/*"
        },

        cf: {
          cacheTtl: 0,
          cacheEverything: false
        }
      }
    );

    if (!respuesta.ok) {
      return respuestaJson(
        {
          error:
            "No fue posible obtener los datos desde Dropbox",

          estado:
            respuesta.status
        },
        502
      );
    }

    const contenido =
      await respuesta.text();

    return new Response(
      contenido,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/json; charset=UTF-8",

          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",

          "Pragma":
            "no-cache",

          "Expires":
            "0",

          "X-Content-Type-Options":
            "nosniff"
        }
      }
    );

  } catch (error) {
    return respuestaJson(
      {
        error:
          "No fue posible obtener los datos desde Dropbox",

        detalle:
          error instanceof Error
            ? error.message
            : String(error)
      },
      502
    );
  }
}

function respuestaJson(
  contenido,
  estado = 200
) {
  return new Response(
    JSON.stringify(contenido),
    {
      status: estado,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Cache-Control":
          "no-store",

        "X-Content-Type-Options":
          "nosniff"
      }
    }
  );
}
