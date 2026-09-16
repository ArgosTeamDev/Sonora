# Dominio

## Qué es

Un diario de escucha. El usuario califica los álbumes que escucha con una
puntuación de media estrella a cinco y, si quiere, escribe una reseña. Con el
tiempo el perfil se vuelve un registro de qué estuvo escuchando y qué le pareció.

El párrafo largo del que salió el modelo:

> Un **usuario** califica **álbumes** del catálogo con una puntuación de 0.5 a 5
> estrellas y, si quiere, escribe una **reseña**. Solo puede tener una
> calificación por álbum, pero puede editarla y marcarla como reescucha. Cada
> **álbum** pertenece a un **artista** y tiene uno o más géneros. Los usuarios
> pueden **seguirse** entre sí y ver sus calificaciones recientes en un feed. El
> promedio de un álbum se calcula a partir de todas sus calificaciones.

Sustantivos → entidades: user, album, artist, review, follow.
Verbos → casos de uso: calificar, reseñar, seguir, explorar.

## Quién la usa

Un solo tipo de usuario. Sin roles ni administración: el catálogo viene
precargado desde el seed.

| Rol | Qué puede hacer |
|-----|-----------------|
| Usuario | Explorar el catálogo, calificar, reseñar, seguir a otros, ver perfiles |

## Entidades

| Entidad | Qué representa | Notas |
|---------|----------------|-------|
| `User` | Quien califica | `username` único, se usa en la URL del perfil |
| `Artist` | Quien publica los álbumes | `slug` único para la URL |
| `Album` | La unidad que se califica | Pertenece a un artista, tiene géneros |
| `Review` | **La entidad central.** La calificación de un usuario sobre un álbum | Tabla intermedia N:M con datos propios |
| `Follow` | Que un usuario sigue a otro | Relación de un usuario consigo mismo |

## Qué se puede hacer

- [ ] Explorar el catálogo con filtros por género, año y orden
- [ ] Ver el detalle de un álbum con su promedio y las reseñas de otros
- [ ] Calificar un álbum (de media a cinco estrellas)
- [ ] Escribir, editar y borrar la reseña de un álbum
- [ ] Marcar una calificación como reescucha
- [ ] Ver el perfil de un usuario y sus reseñas
- [ ] Ver la discografía de un artista
- [ ] Compartir el enlace de una reseña
- [ ] Seguir a otros usuarios y ver su actividad en un feed *(si alcanza el tiempo)*

## Reglas de negocio

Estas son las que viven en `domain/`, no en el controller ni en la base de datos:

1. Una calificación va de 0.5 a 5, solo en saltos de media estrella.
2. Un usuario tiene **como máximo una reseña por álbum**. Intentar crear una
   segunda responde `DUPLICATE_REVIEW` (409). Para cambiarla, se edita la existente.
3. Se puede calificar sin escribir texto. No se puede escribir texto sin calificar.
4. Una reseña solo la puede editar o borrar su autor.
5. El promedio de un álbum es dato **derivado**: se calcula al leer, nunca se guarda.
6. Un álbum sin reseñas tiene promedio `null`, no `0`. Cero sería una calificación
   pésima; `null` significa "todavía nadie lo ha escuchado".
7. Un usuario no puede seguirse a sí mismo, ni seguir dos veces a la misma persona.

## Fuera de alcance

Lo que decidimos **no** hacer en la primera entrega:

- **Canciones individuales.** Duplicaría el modelo entero (canción, calificación
  de canción, posición en el álbum). La unidad de calificación es el álbum.
- **Autenticación real.** El usuario actual viene fijo desde el seed.
- **Listas ordenadas** tipo "Mis 10 de 2025". Es una entidad más con su propia UI.
- **Integración con Spotify o MusicBrainz.** El catálogo es un seed local.
- **Likes y comentarios en reseñas.**
- **Búsqueda por texto.** Solo filtros por género, año y artista.