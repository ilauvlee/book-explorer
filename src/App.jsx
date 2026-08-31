import React, { useEffect, useState } from 'react'
import 'toastr/build/toastr.min.css'

const sakuraBlossoms = [
  'one', 'two', 'three', 'four', 'five', 'six', 'seven',
]

const fallingPetals = Array.from({ length: 12 }, (_, index) => index + 1)

// Extracts cover image URL from the novel data object.
const getCoverUrl = (novel) => {
  if (!novel.cover_i) {
    return null
  }
  return `https://covers.openlibrary.org/b/id/${novel.cover_i}-M.jpg`
}

// Extracts the author name from the novel data object.
const getAuthor = (novel) => {
  return novel.author_name?.[0] || 'Unknown Author'
}

// Extracts the publication year from the novel data object.
const getYear = (novel) => {
  return novel.first_publish_year || 'Unknown'
}

function SakuraBlossom({ position }) {
  return (
    <span className={`sakura-blossom sakura-blossom--${position}`}>
      {[0, 1, 2, 3, 4].map((petal) => (
        <i key={petal}></i>
      ))}
      <b></b>
    </span>
  )
}

// Handles user input and triggers search logic via props.
function SearchBar({ query, onQueryChange, onSubmit, onClear, placeholder, formClass }) {
  return (
    <form className={formClass} onSubmit={onSubmit}>
      <i className="fa-solid fa-magnifying-glass"></i>

      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search novels"
      />

      {query && (
        <button
          type="button"
          className={formClass === 'search-bar' ? 'search-clear' : ''}
          onClick={onClear}
          aria-label="Clear search"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
    </form>
  )
}

// Displays individual novel data passed down as props.
function NovelCard({ novel, onSelect }) {
  const coverUrl = getCoverUrl(novel)

  return (
    <article className="novel-card" onClick={() => onSelect(novel)}>
      <div className="novel-cover">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Cover of ${novel.title}`}
            loading="lazy"
          />
        ) : (
          <div className="novel-cover-placeholder">
            <i className="fa-solid fa-book-open"></i>
          </div>
        )}
      </div>

      <div className="novel-card-content">
        <p className="novel-genre">
          {novel.subject?.[0] || 'Novel'}
        </p>

        <h3>{novel.title}</h3>

        <p className="novel-author">
          <i className="fa-solid fa-pen-nib"></i>
          {getAuthor(novel)}
        </p>

        <div className="novel-meta">
          <span>
            <i className="fa-regular fa-calendar"></i>
            {getYear(novel)}
          </span>

          {novel.edition_count && (
            <span>
              <i className="fa-solid fa-layer-group"></i>
              {novel.edition_count} editions
            </span>
          )}
        </div>

        <button
          type="button"
          className="read-button"
          onClick={(event) => {
            event.stopPropagation()
            onSelect(novel)
          }}
        >
          View details
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </article>
  )
}

// Displays expanded novel details inside a modal view.
function NovelModal({ novel, onClose }) {
  if (!novel) return null

  return (
    <div className="novel-modal" onClick={onClose}>
      <article
        className="novel-modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="modal-book">
          {getCoverUrl(novel) ? (
            <img
              src={getCoverUrl(novel)}
              alt={`Cover of ${novel.title}`}
            />
          ) : (
            <div className="modal-cover-placeholder">
              <i className="fa-solid fa-book-open"></i>
            </div>
          )}
        </div>

        <div className="modal-content">
          <p className="novel-genre">Novel</p>
          <h2>{novel.title}</h2>
          <p className="modal-author">by {getAuthor(novel)}</p>

          <div className="modal-details">
            <span>
              <i className="fa-regular fa-calendar"></i>
              First published: {getYear(novel)}
            </span>

            {novel.edition_count && (
              <span>
                <i className="fa-solid fa-layer-group"></i>
                {novel.edition_count} editions
              </span>
            )}

            {novel.number_of_pages_median && (
              <span>
                <i className="fa-regular fa-file-lines"></i>
                {novel.number_of_pages_median} pages
              </span>
            )}
          </div>

          {novel.subject?.length > 0 && (
            <div className="modal-subjects">
              {novel.subject.slice(0, 8).map((subject) => (
                <span key={subject}>{subject}</span>
              ))}
            </div>
          )}

          <a
            className="button button--primary"
            href={`https://openlibrary.org${novel.key}`}
            target="_blank"
            rel="noreferrer"
          >
            Open Library
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      </article>
    </div>
  )
}

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [novels, setNovels] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedNovel, setSelectedNovel] = useState(null)

  useEffect(() => {
    const query = searchQuery.trim()

    if (!query) {
      setNovels([])
      setError('')
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    const fetchNovels = async () => {
      try {
        setIsLoading(true)
        setError('')

        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error('Failed to fetch novels.')
        }

        const data = await response.json()
        setNovels(data.docs || [])
      } catch (err) {
        if (err.name === 'AbortError') {
          return
        }
        console.error('Open Library error:', err)
        setError('Unable to load novels. Please try again.')
        setNovels([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    const timer = setTimeout(fetchNovels, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchQuery])

  const handleSearch = (event) => {
    event.preventDefault()
  }

  const clearSearch = () => {
    setSearchQuery('')
    setNovels([])
    setSelectedNovel(null)
  }

  return (
    <div className="site-shell">
      {/* HEADER */}
      <header className="site-header">
        <a className="brand" href="#home">
          <span className="brand-mark">桜</span>
          <span>
            SEARCH FOR NOVEL
            <small>Discover Your Next Great Story.</small>
          </span>
        </a>

        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSubmit={handleSearch}
          onClear={clearSearch}
          placeholder="Search novels, authors, or genres..."
          formClass="search-bar"
        />
      </header>

      <main>
        {/* HERO */}
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="kicker">物語 · Stories · Adventures</p>
            <h1>
              Find your next
              <span>great story.</span>
            </h1>

            <p className="hero-description">
              Search millions of books from the Open Library collection.
              Discover new authors, explore different genres, and find your
              next favorite novel.
            </p>

            <SearchBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onSubmit={handleSearch}
              onClear={clearSearch}
              placeholder="What story are you looking for?"
              formClass="hero-search"
            />

            <div className="search-stats">
              <span>
                <strong>{novels.length}</strong>{' '}
                {novels.length === 1 ? 'result' : 'results'}
              </span>
              <span>·</span>
              <span>Open Library</span>
            </div>
          </div>

          {/* SAKURA ART */}
          <div className="hero-art" aria-label="Sakura-inspired novel artwork">
            <div className="sun" aria-hidden="true"></div>

            <div className="sakura-scene" aria-hidden="true">
              <span className="sakura-branch sakura-branch--main"></span>
              <span className="sakura-branch sakura-branch--small"></span>

              {sakuraBlossoms.map((blossom) => (
                <SakuraBlossom key={blossom} position={blossom} />
              ))}
            </div>

            <div className="falling-petals" aria-hidden="true">
              {fallingPetals.map((petal) => (
                <span
                  className={`falling-petal falling-petal--${petal}`}
                  key={petal}
                ></span>
              ))}
            </div>

            <div className="portrait-frame novel-frame">
              <span className="vertical-copy">読書 · 物語 · 想像</span>
              <div className="monogram">
                <i className="fa-solid fa-book-open"></i>
              </div>
              <p>Stories · Waiting · To Be Found</p>
            </div>

            <div className="brush-line brush-line--one"></div>
            <div className="brush-line brush-line--two"></div>
          </div>
        </section>

        {/* SEARCH RESULTS */}
        <section className="section novels" id="novels">
          <div className="section-title">
            <span className="section-number">01</span>
            <div>
              <p>物語を探す</p>
              <h2>Novel Collection</h2>
            </div>
          </div>

          {!searchQuery && !isLoading && (
            <div className="novel-empty">
              <i className="fa-solid fa-book-open"></i>
              <h3>Start your search.</h3>
              <p>Enter a title, author, or keyword above to discover novels from Open Library.</p>
            </div>
          )}

          {isLoading && (
            <div className="novel-loading">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Searching the library...</p>
            </div>
          )}

          {error && (
            <div className="novel-empty novel-empty--error">
              <i className="fa-solid fa-circle-exclamation"></i>
              <h3>Something went wrong.</h3>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && searchQuery && novels.length === 0 && (
            <div className="novel-empty">
              <i className="fa-solid fa-book-open"></i>
              <h3>No novels found.</h3>
              <p>Try another title, author, or keyword.</p>
            </div>
          )}

          {!isLoading && novels.length > 0 && (
            <div className="novel-grid">
              {novels.slice(0, 24).map((novel, index) => (
                <NovelCard
                  key={`${novel.key}-${index}`}
                  novel={novel}
                  onSelect={setSelectedNovel}
                />
              ))}
            </div>
          )}
        </section>

        {/* SIMPLE DISCOVERY SECTION */}
        <section className="section discovery">
          <div className="discovery-inner">
            <p className="kicker">今日の物語 · Today's discovery</p>
            <h2>
              There is always
              <span>another story.</span>
            </h2>
            <p>Search, explore, and let the next page take you somewhere new.</p>
            <a href="#home" className="button button--primary">
              <i className="fa-solid fa-magnifying-glass"></i>
              Search again
            </a>
          </div>
        </section>
      </main>

      {/* NOVEL DETAILS MODAL */}
      <NovelModal
        novel={selectedNovel}
        onClose={() => setSelectedNovel(null)}
      />

      <footer>
        <p>© {new Date().getFullYear()} Search For Novel</p>
        <p>桜 · Stories worth discovering.</p>
      </footer>
    </div>
  )
}

export default App