# Domain

## What it is

A listening diary. The user rates the albums they listen to with a score
from half a star to five, and, if they want, writes a review. Over time the
profile becomes a record of what they were listening to and what they thought.

The long paragraph the model came from:

> A **user** rates **albums** from the catalog with a score from 0.5 to 5
> stars and, if they want, writes a **review**. They can only have one rating
> per album, but can edit it and mark it as a relisten. Each **album**
> belongs to an **artist** and has one or more genres. Users can
> **follow** each other and see their recent ratings in a feed. An album's
> average rating is computed from all of its ratings.

Nouns → entities: user, album, artist, review, follow.
Verbs → use cases: rate, review, follow, explore.

## Who uses it

A single type of user. No roles or admin: the catalog comes
preloaded from the seed.

| Role | What they can do |
|-----|-----------------|
| User | Explore the catalog, rate, review, follow others, view profiles |

## Entities

| Entity | What it represents | Notes |
|---------|----------------|-------|
| `User` | Who rates | Unique `username`, used in the profile URL |
| `Artist` | Who publishes the albums | Unique `slug` for the URL |
| `Album` | The unit being rated | Belongs to an artist, has genres |
| `Review` | **The central entity.** A user's rating of an album | N:M join table with its own data |
| `Follow` | That a user follows another | A user's relation to itself |

## What can be done

- [ ] Explore the catalog with filters by genre, year and sort order
- [ ] View an album's detail with its average and other people's reviews
- [ ] Rate an album (half to five stars)
- [ ] Write, edit and delete a review for an album
- [ ] Mark a rating as a relisten
- [ ] View a user's profile and their reviews
- [ ] View an artist's discography
- [ ] Share a review's link
- [ ] Follow other users and see their activity in a feed *(if time allows)*

## Business rules

These are the ones that live in `domain/`, not in the controller or the database:

1. A rating goes from 0.5 to 5, only in half-star steps.
2. A user has **at most one review per album**. Trying to create a
   second one responds `DUPLICATE_REVIEW` (409). To change it, the existing one is edited.
3. You can rate without writing text. You can't write text without rating.
4. A review can only be edited or deleted by its author.
5. An album's average is **derived** data: it's computed on read, never stored.
6. An album with no reviews has a `null` average, not `0`. Zero would be an
   awful rating; `null` means "nobody has listened to it yet."
7. A user cannot follow themselves, nor follow the same person twice.

## Out of scope

What we decided **not** to do in the first delivery:

- **Individual tracks.** It would duplicate the whole model (track, track
  rating, position in the album). The rating unit is the album.
- **Real authentication.** The current user comes fixed from the seed.
- **Ranked lists** like "My Top 10 of 2025." It's one more entity with its own UI.
- **Spotify or MusicBrainz integration.** The catalog is a local seed.
- **Likes and comments on reviews.**
- **Text search.** Only filters by genre, year and artist.
