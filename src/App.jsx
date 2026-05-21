import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Download,
  FileDown,
  FileUp,
  PencilLine,
  Play,
  Plus,
  Trash2,
  Users,
  Bold,
  Italic,
  Image,
  Code,
} from 'lucide-react'
import {
  GameProvider,
  useGame,
  fileToBase64,
  exportGameAsJson,
  importGameFromFile,
} from './context/GameContext'

function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  )
}

function Shell() {
  const [screen, setScreen] = useState('home')
  const [playerCount, setPlayerCount] = useState(2)
  const [players, setPlayers] = useState([])

  if (screen === 'builder') {
    return <BuilderView onBack={() => setScreen('home')} />
  }

  if (screen === 'play-setup') {
    return (
      <PlaySetupView
        playerCount={playerCount}
        setPlayerCount={setPlayerCount}
        onBack={() => setScreen('home')}
        onStart={() => {
          const nextPlayers = Array.from({ length: playerCount }, (_, index) => ({
            id: crypto.randomUUID(),
            name: `Player ${index + 1}`,
            score: 0,
          }))
          setPlayers(nextPlayers)
          setScreen('play')
        }}
      />
    )
  }

  if (screen === 'play') {
    return (
      <PlayHostView
        players={players}
        setPlayers={setPlayers}
        onBack={() => setScreen('home')}
      />
    )
  }

  return (
    <HomeView
      onOpenBuilder={() => setScreen('builder')}
      onOpenPlaySetup={() => setScreen('play-setup')}
    />
  )
}

function HomeView({ onOpenBuilder, onOpenPlaySetup }) {
  const { setGame } = useGame()



  return (
    <main className="min-h-screen bg-[#2d3b9f] flex items-center justify-center p-6 text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-12">
        <header className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4 drop-shadow-md">
            Trivia Builder + Host
          </h1>
          <p className="text-lg text-slate-200 max-w-2xl mx-auto drop-shadow-sm font-medium leading-relaxed">
            Your all-in-one platform to create, customize, and present an unforgettable trivia experience.
          </p>
        </header>

        <section className="grid w-full gap-8 md:grid-cols-2">
          <button
            type="button"
            onClick={onOpenBuilder}
            className="group relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-white/10 bg-slate-900/80 p-8 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400 hover:bg-slate-900 hover:shadow-2xl hover:shadow-indigo-500/30"
          >
            <div className="mb-6 rounded-full bg-indigo-500/20 p-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-indigo-500/30">
              <PencilLine className="h-10 w-10 text-indigo-400" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white tracking-wide">Create Board</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Build a new trivia game from scratch or load an existing JSON file to make modifications.
            </p>
          </button>

          <button
            type="button"
            onClick={onOpenPlaySetup}
            className="group relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-white/10 bg-slate-900/80 p-8 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:bg-slate-900 hover:shadow-2xl hover:shadow-blue-500/30"
          >
            <div className="mb-6 rounded-full bg-blue-500/20 p-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-500/30">
              <Play className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white tracking-wide">Play Game</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Launch the interactive presentation board, manage player scores, and start your trivia night.
            </p>
          </button>
        </section>
      </div>
    </main>
  )
}

function BuilderView({ onBack }) {
  const {
    game,
    setGameTitle,
    addColumn,
    addRow,
    removeRow,
    removeCategory,
    updateCategoryName,
    removeClue,
    swapClueCells,
    swapRows,
    swapCategories,
    updateClue,
    updateRowPoints,
    setGame,
    ensureCell,
  } = useGame()

  const [selectedCell, setSelectedCell] = useState(null)
  const [draggedCell, setDraggedCell] = useState(null)
  const [draggedRow, setDraggedRow] = useState(null)
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState(null)
  const [editingRowIndex, setEditingRowIndex] = useState(null)
  const [editingRowValue, setEditingRowValue] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [floatingRowDelete, setFloatingRowDelete] = useState(null)
  const dragActiveRef = useRef(false)
  const suppressNextClickRef = useRef(false)
  const hideFloatingRowDeleteRef = useRef(null)

  const headerRef = useRef(null)
  const boardRef = useRef(null)
  const [boardHeight, setBoardHeight] = useState(520)

  const rowCount = useMemo(() => game.rowPoints?.length ?? 0, [game.rowPoints])

  const openCell = (categoryId, rowIndex) => {
    if (dragActiveRef.current || suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }
    ensureCell(categoryId, rowIndex)
    setSelectedCell({ categoryId, rowIndex })
  }

  const closeCell = () => setSelectedCell(null)

  const selectedCategory = selectedCell
    ? game.categories.find((category) => category.id === selectedCell.categoryId)
    : null
  const selectedClue =
    selectedCategory && selectedCell ? selectedCategory.clues[selectedCell.rowIndex] : null

  const importOnBuilder = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const imported = await importGameFromFile(file)
      setGame(imported)
    } catch {
      window.alert('Invalid JSON file. Please import a valid game export.')
    } finally {
      event.target.value = ''
    }
  }

  useEffect(() => {
    const recalc = () => {
      const headerRect = headerRef.current?.getBoundingClientRect()
      const top = headerRect ? headerRect.bottom : 0
      // give some spacing for paddings and controls
      const footerSpace = 160
      const available = Math.max(320, window.innerHeight - top - footerSpace)
      setBoardHeight(available)
    }
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [rowCount, game.categories.length])

  const exportFile = () => exportGameAsJson(game)

  const startEditingRow = (rowIndex) => {
    setEditingRowIndex(rowIndex)
    setEditingRowValue(String(game.rowPoints?.[rowIndex] ?? (rowIndex + 1) * 100))
  }

  const startEditingCategory = (categoryId) => {
    setEditingCategoryId(categoryId)
  }

  const commitEditingRow = () => {
    if (editingRowIndex === null) return

    const nextPoints = Number(editingRowValue)
    if (Number.isFinite(nextPoints)) {
      updateRowPoints(editingRowIndex, nextPoints)
    }

    setEditingRowIndex(null)
    setEditingRowValue('')
  }

  const saveCell = (patch) => {
    if (!selectedCell || !selectedClue) return
    updateClue(selectedCell.categoryId, selectedClue.id, patch)
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeCell()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!selectedCell || !selectedCategory) return
    const nextClue = selectedCategory.clues[selectedCell.rowIndex]
    if (!nextClue) {
      setSelectedCell(null)
    }
  }, [selectedCell, selectedCategory])

  const uploadImage = async (file) => {
    if (!file || !selectedCell) return
    const imageBase64 = await fileToBase64(file)
    saveCell({ imageBase64 })
  }

  return (
    <main className="min-h-screen bg-[#2d3b9f] p-3 text-slate-100 md:p-4">
      <div className="mx-auto flex w-full max-w-full flex-col gap-4 px-4">
        <header ref={headerRef} className="rounded-xl bg-slate-900 p-4 shadow-lg">
          <div className="relative flex flex-wrap items-center justify-between gap-3 mb-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </button>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="rounded-md bg-slate-800/0 px-3 py-1 text-lg font-semibold text-white/95">Create Board</div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addRow}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                + Row
              </button>
              <button
                type="button"
                onClick={addColumn}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                + Column
              </button>
              <button
                type="button"
                onClick={exportFile}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                <FileUp className="h-4 w-4" />
                Export
              </button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition">
                <FileDown className="h-4 w-4" />
                Import
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={importOnBuilder}
                />
              </label>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-5">
            Enter your game title and category names. Click a card to edit question/answer. Hover over filled cards to reveal answers.
          </p>
        </header>

        <section className="pt-6">
          <div className="mx-auto mb-3 w-full max-w-4xl px-4">
            <input
              value={game.title}
              onChange={(event) => setGameTitle(event.target.value)}
              placeholder="Enter board title"
              className="w-full rounded-md bg-transparent px-4 py-3 text-center text-2xl md:text-3xl font-bold text-white outline-none placeholder:text-slate-300/60"
            />
          </div>

          <div ref={boardRef} className="overflow-x-auto rounded-xl border border-slate-700 bg-[#2d3b9f] pt-4 pb-2 px-4 shadow-lg" style={{ height: boardHeight }}>
              <div
                className="min-w-full h-full gap-1"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `72px repeat(${game.categories.length}, minmax(120px, 1fr))`,
                  gridTemplateRows: `auto repeat(${rowCount}, minmax(0, 1fr))`,
                }}
              >
            <div className="h-full" />
            {game.categories.map((category, categoryIndex) => (
              <div key={category.id} className="h-full p-2">
                <div
                  draggable={editingCategoryId !== category.id}
                  onDoubleClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    startEditingCategory(category.id)
                  }}
                  onDragStart={() => {
                    dragActiveRef.current = true
                    setDraggedCategoryIndex(categoryIndex)
                  }}
                  onDragEnd={() => {
                    dragActiveRef.current = false
                    setDraggedCategoryIndex(null)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const source = draggedCategoryIndex
                    dragActiveRef.current = false
                    setDraggedCategoryIndex(null)
                    if (source !== null && source !== categoryIndex) {
                      swapCategories(source, categoryIndex)
                    }
                  }}
                  className={`group relative mb-2 flex cursor-grab items-center justify-center rounded bg-transparent px-2 py-2 transition-opacity ${draggedCategoryIndex === categoryIndex ? 'opacity-40' : ''} ${editingCategoryId !== category.id ? '' : 'cursor-text'}`}
                >
                  {editingCategoryId === category.id ? (
                    <input
                      autoFocus
                      value={category.name}
                      onChange={(event) => updateCategoryName(category.id, event.target.value)}
                      onFocus={(event) => event.currentTarget.select()}
                      onBlur={() => setEditingCategoryId(null)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') setEditingCategoryId(null)
                      }}
                      className="w-full rounded border-none bg-transparent text-center text-lg font-semibold uppercase tracking-wide text-white outline-none placeholder:text-slate-200/60"
                      placeholder="Enter Category Name"
                    />
                  ) : (
                    <div className="w-full truncate text-center text-xl font-semibold uppercase tracking-wide text-white">
                      {category.name}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete column "${category.name}"?`)) {
                        removeCategory(category.id)
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-transparent p-1 text-white/90 opacity-0 transition group-hover:opacity-100 hover:bg-black/15"
                    title="Remove column"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {Array.from({ length: rowCount }, (_, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                className="contents"
              >
                    <div className="group relative h-full overflow-visible">
                  <div
                    draggable={editingRowIndex !== rowIndex}
                    onMouseEnter={(event) => {
                      if (hideFloatingRowDeleteRef.current) {
                        window.clearTimeout(hideFloatingRowDeleteRef.current)
                        hideFloatingRowDeleteRef.current = null
                      }

                      const rect = event.currentTarget.getBoundingClientRect()
                      setFloatingRowDelete({
                        rowIndex,
                        top: rect.top + rect.height / 2,
                        left: rect.left,
                      })
                    }}
                    onMouseLeave={() => {
                      hideFloatingRowDeleteRef.current = window.setTimeout(() => {
                        setFloatingRowDelete((current) =>
                          current?.rowIndex === rowIndex ? null : current,
                        )
                        hideFloatingRowDeleteRef.current = null
                      }, 80)
                    }}
                    onDoubleClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      startEditingRow(rowIndex)
                    }}
                    onDragStart={() => {
                      dragActiveRef.current = true
                      setDraggedRow(rowIndex)
                    }}
                    onDragEnd={() => {
                      dragActiveRef.current = false
                      setDraggedRow(null)
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const source = draggedRow
                      dragActiveRef.current = false
                      setDraggedRow(null)
                      if (source !== null && source !== rowIndex) {
                        swapRows(source, rowIndex)
                      }
                    }}
                    className={`flex h-full w-full cursor-grab items-center justify-center rounded-[4px] border border-black/40 bg-[#2d3b9f] p-0 box-border text-white transition-opacity ${draggedRow === rowIndex ? 'opacity-40' : ''} ${editingRowIndex !== rowIndex ? '' : 'cursor-text'}`}
                  >
                      {editingRowIndex === rowIndex ? (
                      <input
                        autoFocus
                        type="text"
                        inputMode="numeric"
                        value={editingRowValue}
                        onChange={(event) => setEditingRowValue(event.target.value)}
                        onFocus={(event) => event.currentTarget.select()}
                        onBlur={commitEditingRow}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') commitEditingRow()
                          if (event.key === 'Escape') {
                            setEditingRowIndex(null)
                            setEditingRowValue('')
                          }
                        }}
                        className="w-full border-none bg-transparent text-center text-sm font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      ) : (
                      <div className="text-center text-base font-semibold">
                        {game.rowPoints?.[rowIndex] ?? (rowIndex + 1) * 100}
                      </div>
                    )}
                  </div>
                </div>

                {game.categories.map((category) => {
                  const clue = category.clues[rowIndex] ?? null
                  const questionHtml = clue?.question ? markdownToHtml(clue.question) : ''
                  const answerHtml = clue?.answer ? markdownToHtml(clue.answer) : ''
                  const points = game.rowPoints?.[rowIndex] ?? (rowIndex + 1) * 100
                  const hasQuestion = Boolean(clue?.question?.trim())
                  const hasAnswer = Boolean(clue?.answer?.trim())
                  const hasContent = hasQuestion || hasAnswer
                  const questionLength = questionHtml.length
                  const answerLength = answerHtml.length
                  const questionTextSize = questionLength > 220
                    ? 'text-[0.7rem]'
                    : questionLength > 140
                    ? 'text-[0.8rem]'
                    : questionLength > 90
                    ? 'text-sm'
                    : 'text-base'
                  const answerTextSize = answerLength > 220
                    ? 'text-[0.7rem]'
                    : answerLength > 140
                    ? 'text-[0.8rem]'
                    : answerLength > 90
                    ? 'text-sm'
                    : 'text-base'

                  return (
                    <button
                      key={`${category.id}-${rowIndex}`}
                      type="button"
                      draggable={hasContent}
                      onDragStart={hasContent ? (event) => {
                        dragActiveRef.current = true
                        suppressNextClickRef.current = true
                        setDraggedCell({ categoryId: category.id, rowIndex })
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', `${category.id}:${rowIndex}`)
                      } : undefined}
                      onDragEnd={hasContent ? () => {
                        dragActiveRef.current = false
                        setDraggedCell(null)
                        window.setTimeout(() => {
                          suppressNextClickRef.current = false
                        }, 100)
                      } : undefined}
                      onDragOver={(event) => {
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        const source = draggedCell
                        dragActiveRef.current = false
                        setDraggedCell(null)
                        if (!source) return
                        suppressNextClickRef.current = true
                        window.setTimeout(() => {
                          suppressNextClickRef.current = false
                        }, 100)
                        swapClueCells(source.categoryId, source.rowIndex, category.id, rowIndex)
                      }}
                      onClick={() => openCell(category.id, rowIndex)}
                      className={`group h-full w-full rounded-[4px] [perspective:1200px] ${hasContent ? 'cursor-grab' : 'cursor-pointer'} transition-transform duration-150 hover:shadow-lg hover:brightness-105 ${
                        draggedCell?.categoryId === category.id && draggedCell?.rowIndex === rowIndex
                          ? 'opacity-40'
                          : ''
                      }`}
                    >
                      <div
                        className={`relative h-full w-full transition-transform duration-350 [transform-style:preserve-3d] ${
                          hasAnswer ? 'group-hover:[transform:rotateY(180deg)]' : ''
                        }`}
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-[4px] border border-black bg-[#2d3b9f] [backface-visibility:hidden] box-border">
                          <div className={`h-full w-full flex items-center justify-center px-2 text-center font-bold leading-tight text-white overflow-hidden break-words whitespace-normal ${hasContent ? questionTextSize : 'text-base'}`}>
                            <div className="w-full line-clamp-4">
                              {hasContent ? (
                                <div dangerouslySetInnerHTML={{ __html: questionHtml }} />
                              ) : (
                                <span className="text-white/55">{points}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pointer-events-none absolute inset-0 rounded-[4px] border border-black bg-indigo-600 [backface-visibility:hidden] [transform:rotateY(180deg)] box-border">
                          <div className={`h-full w-full flex items-center justify-center px-2 text-center font-bold leading-tight text-white overflow-hidden break-words whitespace-normal ${answerHtml ? answerTextSize : 'text-base'}`}>
                            <div className="w-full line-clamp-4">
                              {answerHtml ? (
                                <div dangerouslySetInnerHTML={{ __html: answerHtml }} />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          </div>
        </section>
      </div>

      {selectedCell && selectedClue ? (
        <BoardCellModal
          title={game.categories.find((category) => category.id === selectedCell.categoryId)?.name ??
            'Clue'}
          clue={selectedClue}
          onClose={closeCell}
          onSave={(patch) => saveCell(patch)}
          onDelete={() => {
            if (window.confirm(`Delete card?`)) {
              removeClue(selectedCell.categoryId, selectedClue.id)
              closeCell()
            }
          }}
        />
      ) : null}

      {floatingRowDelete && rowCount > 1 ? (
        <button
          type="button"
          onMouseEnter={() => {
            if (hideFloatingRowDeleteRef.current) {
              window.clearTimeout(hideFloatingRowDeleteRef.current)
              hideFloatingRowDeleteRef.current = null
            }
          }}
          onMouseLeave={() => {
            setFloatingRowDelete(null)
          }}
          onMouseDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={() => {
            const rowIndex = floatingRowDelete.rowIndex
            if (window.confirm(`Delete row ${game.rowPoints?.[rowIndex] ?? (rowIndex + 1) * 100}?`)) {
              removeRow(rowIndex)
            }
            setFloatingRowDelete(null)
          }}
          className="fixed z-[99999] rounded bg-rose-900/75 p-1 text-rose-50 shadow-2xl transition hover:bg-rose-800"
          style={{
            top: `${floatingRowDelete.top}px`,
            left: `${floatingRowDelete.left}px`,
            transform: 'translate(calc(-100% - 10px), -50%)',
          }}
          title="Delete row"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      ) : null}
    </main>
  )
}

function BoardCellModal({ title, clue, onClose, onSave, onDelete }) {
  const [questionHtml, setQuestionHtml] = useState(
    clue.question && clue.question.includes('<') ? clue.question : markdownToHtml(clue.question),
  )
  const [answerHtml, setAnswerHtml] = useState(
    clue.answer && clue.answer.includes('<') ? clue.answer : markdownToHtml(clue.answer),
  )
  const questionRef = useRef(null)
  const answerRef = useRef(null)
  const questionImageInputRef = useRef(null)
  const answerImageInputRef = useRef(null)
  const selectionMapRef = useRef(new WeakMap())
  const isSelectingImageRef = useRef(false)

  useEffect(() => {
    setQuestionHtml(clue.question && clue.question.includes('<') ? clue.question : markdownToHtml(clue.question))
    setAnswerHtml(clue.answer && clue.answer.includes('<') ? clue.answer : markdownToHtml(clue.answer))
  }, [clue])

  const handleSave = () => {
    const unescapeHtml = (html) => {
      const txt = document.createElement('textarea')
      txt.innerHTML = html
      return txt.value
    }
    const rawQ = questionRef.current?.innerHTML ?? questionHtml
    const rawA = answerRef.current?.innerHTML ?? answerHtml
    // If the content contains no tags (plain text), unescape entities before storing
    const q = rawQ.includes('<') ? rawQ : unescapeHtml(rawQ)
    const a = rawA.includes('<') ? rawA : unescapeHtml(rawA)
    onSave({ question: q, answer: a })
    onClose()
  }

  const applyFormat = (ref, setter, prefix, suffix = prefix) => {
    const el = ref.current
    if (!el) return

    // Ensure the editable element has focus so execCommand applies correctly
    try {
      el.focus()
    } catch (e) {
      // ignore
    }

    // If it's a textarea, operate on text selection
    if (el.tagName === 'TEXTAREA') {
      const textarea = el
      const start = textarea.selectionStart ?? 0
      const end = textarea.selectionEnd ?? 0
      const selected = textarea.value.slice(start, end)
      const nextValue = `${textarea.value.slice(0, start)}${prefix}${selected}${suffix}${textarea.value.slice(end)}`
      setter(nextValue)

      requestAnimationFrame(() => {
        textarea.focus()
        const selectionStart = start + prefix.length
        const selectionEnd = selectionStart + selected.length
        textarea.setSelectionRange(selectionStart, selectionEnd)
      })
      return
    }

    // For contentEditable, use document.execCommand for bold/italic and insertHTML for code
    const sel = window.getSelection()
    if (!sel) return

    if (prefix === '`') {
      const selected = sel.toString() || ''
      document.execCommand('insertHTML', false, `<code>${selected}</code>`)
    } else if (prefix === '**') {
      document.execCommand('bold')
    } else if (prefix === '*') {
      document.execCommand('italic')
    }

    // Do NOT write back into React state here; wait for onBlur or explicit save
    // to avoid re-rendering the contentEditable and moving the caret.
  }

  const saveSelectionForRef = (ref) => {
    try {
      const el = ref.current
      const sel = window.getSelection()
      if (!el || !sel || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0).cloneRange()
      // Insert a lightweight marker so we can reliably find the insertion point
      // after the file dialog (markers are removed after insertion or timeout).
      const marker = document.createElement('span')
      marker.dataset.caretMarker = '1'
      marker.style.width = '0'
      marker.style.height = '0'
      marker.style.display = 'inline-block'
      marker.style.overflow = 'hidden'
      try {
        // collapse the range to the caret and insert marker
        range.collapse(false)
        range.insertNode(marker)
      } catch (e) {
        // ignore if insertion fails
      }
      selectionMapRef.current.set(el, { range, marker })
      // Cleanup marker in case user cancels the file dialog (avoid leaving markers forever)
      window.setTimeout(() => {
        const entry = selectionMapRef.current.get(el)
        if (entry && entry.marker && entry.marker.parentNode) {
          try { entry.marker.remove() } catch (e) {}
        }
        selectionMapRef.current.delete(el)
      }, 15000)
    } catch (e) {
      // ignore
    }
  }

  const restoreSelectionForRef = (ref) => {
    try {
      const el = ref.current
      const sel = window.getSelection()
      const entry = el && selectionMapRef.current.get(el)
      if (!el || !sel || !entry || !entry.range) return
      sel.removeAllRanges()
      sel.addRange(entry.range)
    } catch (e) {
      // ignore
    }
  }

  const insertImage = async (ref, setter, event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const image = await fileToBase64(file)
    const el = ref.current
    const imageNode = document.createElement('img')
    imageNode.src = image
    imageNode.alt = 'image'
    imageNode.style.maxWidth = '100%'
    imageNode.style.borderRadius = '8px'
    imageNode.style.display = 'block'
    imageNode.style.margin = '8px auto'

    if (!el || el.tagName === 'TEXTAREA') {
      // fallback: insert markdown image into textarea or state
      setter((current) => `${current}\n![image](${image})`)
      event.target.value = ''
      return
    }
    try {
      el.focus()
    } catch (e) {}

    // Try to use the saved marker (most reliable) to insert at the exact caret position.
    const entry = selectionMapRef.current.get(el)
    let inserted = false

    if (entry && entry.marker && entry.marker.parentNode) {
      try {
        entry.marker.replaceWith(imageNode)
        inserted = true
      } catch (e) {
        // ignore
      }
    }

    if (!inserted) {
      // Restore selection (saved before opening file dialog) so insertion happens at caret
      try {
        restoreSelectionForRef(ref)
      } catch (e) {}

      // Insert the image node at the caret position for contentEditable.
      const sel = window.getSelection()
      const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null
      if (range) {
        try {
          range.deleteContents()
          range.insertNode(imageNode)
        } catch (e) {
          el.appendChild(imageNode)
        }
      } else {
        el.appendChild(imageNode)
      }
    }

    // Sync React state with the live DOM so the image persists.
    setter(el.innerHTML)
    
    // Cleanup selection map and markers
    if (entry) {
      if (entry.marker && entry.marker.parentNode) {
        try { entry.marker.remove() } catch (e) {}
      }
      selectionMapRef.current.delete(el)
    }

    event.target.value = ''
    isSelectingImageRef.current = false

    // Restore caret position right after the newly inserted image, even after React's re-render
    setTimeout(() => {
      const newImg = Array.from(el.querySelectorAll('img')).find(img => img.src === image)
      if (newImg) {
        try {
          const sel = window.getSelection()
          const range = document.createRange()
          range.setStartAfter(newImg)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
          el.focus()
        } catch (e) {
          // ignore
        }
      }
    }, 50)
  }

  const handleImageButtonClick = (ref, inputRef) => {
    isSelectingImageRef.current = true
    saveSelectionForRef(ref)

    const onWindowFocus = () => {
      window.removeEventListener('focus', onWindowFocus)
      setTimeout(() => {
        isSelectingImageRef.current = false
      }, 300)
    }
    window.addEventListener('focus', onWindowFocus)

    inputRef.current?.click()
  }

  const toolbarButton = (IconComponent, onClick, tooltip) => (
    <button
      type="button"
      title={tooltip}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className="rounded border border-slate-600 bg-slate-700 p-1.5 text-white hover:bg-slate-600 hover:border-slate-500 transition flex items-center justify-center"
    >
      <IconComponent className="h-4 w-4" />
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-50 shadow-2xl">
        <div className="flex items-center justify-between bg-indigo-600 px-4 py-3 text-white font-semibold">
          <div className="text-lg font-medium">Enter {title} clue</div>
          <button type="button" onClick={onClose} className="rounded px-2 py-1 text-sm hover:bg-white/15">
            Close without Saving [ESC]
          </button>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Question Prompt</span>
              <div className="flex flex-wrap gap-1.5">
                {toolbarButton(Bold, () => applyFormat(questionRef, setQuestionHtml, '**'), 'Bold')}
                {toolbarButton(Italic, () => applyFormat(questionRef, setQuestionHtml, '*'), 'Italic')}
                {toolbarButton(Code, () => applyFormat(questionRef, setQuestionHtml, '`'), 'Code')}
                <button
                  type="button"
                  title="Insert Image"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleImageButtonClick(questionRef, questionImageInputRef)}
                  className="rounded border border-slate-600 bg-slate-700 p-1.5 text-white hover:bg-slate-600 hover:border-slate-500 transition flex items-center justify-center"
                >
                  <Image className="h-4 w-4" />
                </button>
                <input
                  ref={questionImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => insertImage(questionRef, setQuestionHtml, event)}
                />
              </div>
            </div>

            <div
              ref={questionRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                if (isSelectingImageRef.current) return
                setQuestionHtml(e.currentTarget.innerHTML)
              }}
              className="h-[240px] overflow-y-auto rounded-lg border border-slate-600 bg-slate-800 text-slate-50 p-3 text-base outline-none focus:border-slate-500 focus:ring focus:ring-slate-600/30"
              placeholder="Type something"
              dangerouslySetInnerHTML={{ __html: questionHtml }}
            />

            <p className="text-sm text-slate-600">
              It&apos;s traditional in Jeopardy to phrase this as a statement.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Correct Response</span>
              <div className="flex flex-wrap gap-1.5">
                {toolbarButton(Bold, () => applyFormat(answerRef, setAnswerHtml, '**'), 'Bold')}
                {toolbarButton(Italic, () => applyFormat(answerRef, setAnswerHtml, '*'), 'Italic')}
                {toolbarButton(Code, () => applyFormat(answerRef, setAnswerHtml, '`'), 'Code')}
                <button
                  type="button"
                  title="Insert Image"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleImageButtonClick(answerRef, answerImageInputRef)}
                  className="rounded border border-slate-600 bg-slate-700 p-1.5 text-white hover:bg-slate-600 hover:border-slate-500 transition flex items-center justify-center"
                >
                  <Image className="h-4 w-4" />
                </button>
                <input
                  ref={answerImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => insertImage(answerRef, setAnswerHtml, event)}
                />
              </div>
            </div>

            <div
              ref={answerRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                if (isSelectingImageRef.current) return
                setAnswerHtml(e.currentTarget.innerHTML)
              }}
              className="h-[240px] overflow-y-auto rounded-lg border border-slate-600 bg-slate-800 text-slate-50 p-3 text-base outline-none focus:border-slate-500 focus:ring focus:ring-slate-600/30"
              placeholder="Type something"
              dangerouslySetInnerHTML={{ __html: answerHtml }}
            />

            <p className="text-sm text-slate-600">
              And this is traditionally phrased as a question.
            </p>
          </section>
        </div>

        <div className="flex justify-between border-t border-slate-700 bg-slate-800 p-6">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-600 transition"
          >
            Delete Card
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg border-2 border-emerald-400 bg-emerald-500 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-lg hover:shadow-emerald-500/50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

function PlaySetupView({ playerCount, setPlayerCount, onBack, onStart }) {
  const { setGame, game } = useGame()
  const [fileLoaded, setFileLoaded] = useState(false)

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const imported = await importGameFromFile(file)
      setGame(imported)
      setFileLoaded(true)
    } catch {
      window.alert('Invalid JSON file. Please import a valid game export.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className="min-h-screen bg-[#2d3b9f] flex items-center justify-center p-6 text-slate-100">
      <div className="mx-auto w-full max-w-xl rounded-2xl border-2 border-white/10 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-md bg-slate-800/50 px-3 py-2 text-sm font-medium transition hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h2 className="text-3xl font-bold tracking-tight text-white">Host Setup</h2>
        <p className="mt-2 text-slate-300">Upload your game file and set the number of players to start.</p>

        <div className="mt-8 space-y-6">
          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-300 uppercase tracking-wider">
              1. Load Game File
            </span>
            <label className={`flex cursor-pointer items-center justify-between rounded-xl border-2 ${fileLoaded ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-blue-400/50'} p-4 transition-all`}>
              <div className="flex items-center gap-3">
                <FileUp className={`h-6 w-6 ${fileLoaded ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <p className="font-semibold text-white">{fileLoaded ? game.title || 'Game Loaded' : 'Upload JSON'}</p>
                  <p className="text-xs text-slate-400">{fileLoaded ? 'Ready to play' : 'Select a saved game file'}</p>
                </div>
              </div>
              <div className={`rounded-md px-3 py-1 text-xs font-semibold ${fileLoaded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                {fileLoaded ? 'Change' : 'Browse'}
              </div>
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-300 uppercase tracking-wider">
              2. Number of Players
            </span>
            <div className="flex items-center gap-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 p-4">
              <Users className="h-6 w-6 text-slate-400" />
              <input
                type="number"
                min={1}
                max={12}
                value={playerCount}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (Number.isFinite(value)) {
                    setPlayerCount(Math.max(1, Math.min(12, value)))
                  }
                }}
                className="w-full bg-transparent text-xl font-bold text-white outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={!fileLoaded}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-bold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          <Play className="h-5 w-5" />
          Start Game
        </button>
      </div>
    </main>
  )
}

function PlayHostView({ players, setPlayers, onBack }) {
  const { game } = useGame()
  const [playedCells, setPlayedCells] = useState(new Set())
  const [activeCell, setActiveCell] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  
  const [boardHeight, setBoardHeight] = useState(520)
  const titleRowRef = useRef(null)
  const CARD_H = 112

  const totalScore = useMemo(
    () => players.reduce((runningTotal, player) => runningTotal + player.score, 0),
    [players],
  )

  const updatePlayer = (id, patch) => {
    setPlayers((previous) =>
      previous.map((player) => (player.id === id ? { ...player, ...patch } : player)),
    )
  }

  const rowCount = useMemo(() => game.rowPoints?.length ?? 0, [game.rowPoints])

  useEffect(() => {
    const recalc = () => {
      const titleRect = titleRowRef.current?.getBoundingClientRect()
      const top = titleRect ? titleRect.bottom : 0
      const available = Math.max(320, window.innerHeight - top - CARD_H - 12)
      setBoardHeight(available)
    }
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [rowCount, game.categories.length])

  return (
    <main className="h-screen bg-[#2d3b9f] px-3 pt-3 text-slate-100 md:px-4 md:pt-4 flex flex-col overflow-hidden" style={{ paddingBottom: CARD_H }}>
      <div className="flex w-full max-w-full flex-col gap-3 px-4 flex-1 min-h-0">

        {/* Title row: Home | Game Title | Score Pool — no dark bar */}
        <div ref={titleRowRef} className="relative flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-3xl md:text-4xl font-bold text-white truncate pointer-events-none">
            {game.title || 'Trivia Board'}
          </h1>

          <div className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shrink-0">
            Score Pool: {totalScore}
          </div>
        </div>

        {/* Game board */}
        <div className="overflow-x-auto rounded-xl border border-slate-700 bg-[#2d3b9f] pt-4 pb-2 px-4 shadow-lg flex-1 min-h-0" style={{ height: boardHeight }}>
          <div
            className="min-w-full h-full gap-1"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${game.categories.length}, minmax(120px, 1fr))`,
              gridTemplateRows: `auto repeat(${rowCount}, minmax(80px, 1fr))`,
            }}
          >
            {game.categories.map((category) => (
              <div key={category.id} className="h-full p-2">
                <div className="w-full truncate text-center text-xl font-semibold uppercase tracking-wide text-white">
                  {category.name}
                </div>
              </div>
            ))}

            {Array.from({ length: rowCount }).flatMap((_, rowIndex) =>
              game.categories.map((category) => {
                const cellId = `${category.id}-${rowIndex}`
                const isPlayed = playedCells.has(cellId)
                const points = game.rowPoints?.[rowIndex] ?? (rowIndex + 1) * 100
                const clue = category.clues[rowIndex]

                return (
                  <div key={cellId} className="p-0.5">
                    <button
                      type="button"
                      onClick={(event) => {
                        if (clue) {
                          const rect = event.currentTarget.getBoundingClientRect()
                          setActiveCell({ categoryId: category.id, categoryName: category.name, rowIndex, points, clue, originRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height } })
                        }
                      }}
                      className={`flex h-full w-full items-center justify-center rounded-[4px] border-2 bg-[#2d3b9f] box-border text-white transition-all border-black/50 cursor-pointer hover:bg-[#3d4bbf] hover:scale-[1.03] shadow-md font-bold text-2xl
                        ${isPlayed ? 'opacity-40' : ''}
                      `}
                    >
                      <span>{points}</span>
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Fixed floating score cards — always above modal */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-center gap-2 z-[200] pointer-events-none"
        style={{ height: CARD_H }}
      >
        {players.map((player) => (
          <div key={player.id} className="flex flex-col rounded-t-xl border border-slate-700 bg-slate-900 p-3 shadow-lg w-36 pointer-events-auto">
            <input
              value={player.name}
              onChange={(event) => updatePlayer(player.id, { name: event.target.value })}
              className="w-full rounded bg-transparent px-1 py-0.5 text-center font-bold text-white outline-none hover:bg-slate-800 focus:bg-slate-800 transition text-xs"
            />
            <input
              type="number"
              value={player.score}
              onChange={(event) => updatePlayer(player.id, { score: Number(event.target.value) })}
              className="mt-1 w-full rounded bg-transparent px-1 py-0.5 text-center text-xl font-extrabold text-white outline-none hover:bg-slate-800 focus:bg-slate-800 transition [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <div className="mt-2 flex w-full">
              <button
                type="button"
                onClick={() => updatePlayer(player.id, { score: player.score + (activeCell ? activeCell.points : 100) })}
                className="flex-1 py-1 text-base font-bold text-emerald-400 hover:bg-emerald-950/60 transition rounded-l"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => updatePlayer(player.id, { score: player.score - (activeCell ? activeCell.points : 100) })}
                className="flex-1 py-1 text-base font-bold text-rose-400 hover:bg-rose-950/60 transition rounded-r"
              >
                −
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeCell && (
        <HostPlayModal
          cell={activeCell}
          cardHeight={CARD_H}
          onClose={() => setActiveCell(null)}
          onMarkDone={() => {
            setPlayedCells((prev) => new Set(prev).add(`${activeCell.categoryId}-${activeCell.rowIndex}`))
          }}
        />
      )}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-slate-900 border border-slate-700 p-8 shadow-2xl flex flex-col items-center gap-4 min-w-[280px]">
            <h2 className="text-lg font-bold text-white">Leave game?</h2>
            <p className="text-sm text-slate-400 text-center">All progress will be lost.</p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={onBack}
                className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function HostPlayModal({ cell, cardHeight, onClose, onMarkDone }) {
  const [expanded, setExpanded] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const questionHtml = cell.clue?.question ? markdownToHtml(cell.clue.question) : ''
  const answerHtml = cell.clue?.answer ? markdownToHtml(cell.clue.answer) : ''
  const { originRect } = cell

  useEffect(() => {
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        setExpanded(true)
        const tid = window.setTimeout(() => setShowContent(true), 380)
        return () => window.clearTimeout(tid)
      })
      return () => cancelAnimationFrame(id2)
    })
    return () => cancelAnimationFrame(id1)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') { event.preventDefault(); setShowAnswer(true); onMarkDone() }
      else if (event.code === 'Escape') { onClose() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const transition = 'top 420ms cubic-bezier(0.4,0,0.2,1), left 420ms cubic-bezier(0.4,0,0.2,1), width 420ms cubic-bezier(0.4,0,0.2,1), height 420ms cubic-bezier(0.4,0,0.2,1), border-radius 420ms cubic-bezier(0.4,0,0.2,1)'

  const fromStyle = originRect
    ? { top: originRect.top, left: originRect.left, width: originRect.width, height: originRect.height, borderRadius: '4px' }
    : { top: 0, left: 0, width: '100vw', height: `calc(100vh - ${cardHeight}px)`, borderRadius: 0 }

  const toStyle = { top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0 }

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 100,
        backgroundColor: '#2d3b9f',
        color: 'white',
        overflow: 'hidden',
        transition,
        ...(expanded ? toStyle : fromStyle),
      }}
    >
      <div className={`flex flex-col h-full transition-opacity duration-200 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        <header className="relative flex h-10 sm:h-12 shrink-0 items-center justify-between bg-slate-900/80 px-4 text-xs sm:text-sm font-semibold text-slate-300">
          <button
            type="button"
            onClick={onClose}
            className="hover:text-white transition cursor-pointer flex items-center"
          >
            Continue <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-black font-bold">ESC</span>
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 font-bold text-white uppercase tracking-widest pointer-events-none">{cell.categoryName} FOR {cell.points}</div>
          <button
            type="button"
            onClick={() => {
              setShowAnswer(true)
              onMarkDone()
            }}
            className="hover:text-white transition cursor-pointer flex items-center"
          >
            Reveal Correct Response <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-black font-bold">Spacebar</span>
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
          <div
            className="text-3xl sm:text-5xl md:text-7xl font-semibold leading-tight drop-shadow-md mb-8 max-w-6xl break-words"
            dangerouslySetInnerHTML={{ __html: questionHtml || '<span class="text-slate-400 italic">No question</span>' }}
          />
          {showAnswer && (
            <>
              <div className="w-full max-w-4xl border-t-2 border-dashed border-white/40 mb-8" />
              <div
                style={{ animation: 'answerReveal 1.2s cubic-bezier(0.4,0,0.2,1) forwards' }}
                className="text-2xl sm:text-4xl md:text-6xl font-semibold text-white drop-shadow-md max-w-6xl break-words"
                dangerouslySetInnerHTML={{ __html: answerHtml || '<span class="text-slate-400 italic">No answer</span>' }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function markdownToHtml(markdownText) {
  if (!markdownText) return ''

  // If the text already contains HTML, assume it's pre-rendered and pass-through.
  if (markdownText.includes('<')) return markdownText

  const escaped = markdownText
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

  return escaped
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" style="max-width:45px;height:auto;border-radius:8px;display:block;margin:4px auto;" />')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    .replace(/\n/g, '<br />')
}

export default App
