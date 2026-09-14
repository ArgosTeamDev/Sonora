# Modelo de datos

```mermaid
erDiagram
    USER   ||--o{ REVIEW  : escribe
    ALBUM  ||--o{ REVIEW  : recibe
    ARTIST ||--o{ ALBUM   : publica
    USER   ||--o{ FOLLOW  : sigue
    USER   ||--o{ FOLLOW  : es_seguido

    USER {
        uuid        id         PK
        text        username   UK "se usa en la URL del perfil"
        text        name
        text        bio        "nullable"
        text        avatar_url "nullable"
        timestamptz created_at
    }
    ARTIST {
        uuid id   PK
        text name
        text slug UK
    }
    ALBUM {
        uuid        id         PK
        uuid        artist_id  FK
        text        title
        int         year
        text        cover_url  "nullable"
        text_array  genres     "array, máx 5"
        text        mbid       "nullable, id externo"
        text        spotify_id "nullable, id externo"
        timestamptz created_at
    }
    REVIEW {
        uuid        id          PK
        uuid        user_id     FK
        uuid        album_id    FK
        numeric     rating      "0.5 a 5, saltos de 0.5"
        text        body        "nullable"
        bool        is_relisten
        date        listened_at
        int         version     "bloqueo optimista"
        timestamptz created_at
        timestamptz updated_at
    }
    FOLLOW {
        uuid        follower_id  PK, FK
        uuid        following_id PK, FK
        timestamptz created_at
    }
```

## Convenciones

- PK: `uuid`
- Toda tabla lleva `created_at`
- Toda entidad editable lleva `updated_at` y `version` (bloqueo optimista → 409)
- Los géneros son un array en `albums`. No son tabla porque no se administran:
  solo se usan como filtro. Si alguna vez hay que editarlos, se normalizan.

## Decisiones del modelo

| Decisión | Por qué |
|----------|---------|
| `REVIEW` es la tabla intermedia N:M entre user↔album | En cuanto la intermedia tiene datos propios (puntuación, texto, fecha) deja de ser un detalle técnico y se vuelve la entidad central del dominio |
| Único `(user_id, album_id)` | Traduce a la base de datos la regla "una calificación por usuario por álbum". Sin esto, un doble clic crea dos reseñas |
| El promedio **no** se guarda en `albums` | Es dato derivado. Guardarlo obliga a recalcularlo en cada escritura y a mantenerlo consistente. Se calcula al leer |
| `FOLLOW` con dos FK a `USER` | Relación de una tabla consigo misma. PK compuesta `(follower_id, following_id)` para que nadie siga dos veces a la misma persona |
| `genres` como array, no como tabla | No se administran ni tienen atributos propios. Normalizarlos añadiría dos tablas sin beneficio |
| `mbid` y `spotify_id` nullable desde el inicio | No cuestan nada ahora y evitan una migración si alguna vez se enlaza con una API externa |
| `rating` como `numeric`, no `int` | Las medias estrellas son parte del dominio. Guardar décimas y dividir escondería el modelo |

## Borrado en cascada

| Relación | ON DELETE | Por qué |
|----------|-----------|---------|
| `review.user_id` → `user` | CASCADE | Si se va el usuario, se van sus reseñas con él |
| `review.album_id` → `album` | RESTRICT | No borrar un álbum con reseñas: es el historial de alguien |
| `album.artist_id` → `artist` | RESTRICT | No borrar un artista con discografía |
| `follow.*` → `user` | CASCADE | La relación no tiene sentido sin sus dos extremos |

## Índices (entrega 2)

- `review (user_id, album_id)` único — la restricción principal
- `review (album_id)` — para calcular el promedio de un álbum
- `review (user_id, created_at DESC)` — el perfil ordenado por recientes
- `album (artist_id)` — discografía
- `album USING gin (genres)` — filtro por género
- `user (username)` único — resolver el perfil desde la URL

> Nota: en el diagrama, `genres` aparece como `text_array` porque Mermaid no
> siempre acepta la sintaxis `text[]`. En Postgres el tipo real es `text[]`.