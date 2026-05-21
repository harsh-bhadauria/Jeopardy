import { createContext, useContext, useMemo, useState } from 'react'

const GameContext = createContext(null)

const DEFAULT_POINTS_STEP = 100
const DEFAULT_CATEGORY_COUNT = 5
const DEFAULT_ROW_COUNT = 5

const createEmptyClue = (points = DEFAULT_POINTS_STEP) => ({
  id: crypto.randomUUID(),
  points,
  question: '',
  answer: '',
  imageBase64: '',
})

const createEmptyCategory = (index = 0, rowPoints = createDefaultRowPoints()) => ({
  id: crypto.randomUUID(),
  name: `Category ${index + 1}`,
  clues: rowPoints.map((points) => createEmptyClue(points)),
})

const createDefaultRowPoints = () =>
  Array.from({ length: DEFAULT_ROW_COUNT }, (_, rowIndex) => (rowIndex + 1) * DEFAULT_POINTS_STEP)

const createDefaultGame = () => ({
  id: crypto.randomUUID(),
  title: 'New Jeopardy Game',
  rowPoints: createDefaultRowPoints(),
  categories: Array.from({ length: DEFAULT_CATEGORY_COUNT }, (_, categoryIndex) =>
    createEmptyCategory(categoryIndex),
  ),
})

export function GameProvider({ children }) {
  const [game, setGame] = useState(createDefaultGame)

  const setGameTitle = (title) => {
    setGame((previous) => ({ ...previous, title }))
  }

  const addCategory = () => {
    setGame((previous) => ({
      ...previous,
      categories: [
        ...previous.categories,
        createCategoryWithRows(previous.categories.length, previous.rowPoints),
      ],
    }))
  }

  const addRow = () => {
    setGame((previous) => ({
      ...previous,
      rowPoints: [...previous.rowPoints, (previous.rowPoints.length + 1) * DEFAULT_POINTS_STEP],
      categories: previous.categories.map((category) => ({
        ...category,
        clues: [...category.clues, createEmptyClue((previous.rowPoints.length + 1) * DEFAULT_POINTS_STEP)],
      })),
    }))
  }

  const removeRow = (rowIndex) => {
    setGame((previous) => {
      if (previous.rowPoints.length <= 1) return previous

      if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= previous.rowPoints.length) {
        return previous
      }

      return {
        ...previous,
        rowPoints: previous.rowPoints.filter((_, index) => index !== rowIndex),
        categories: previous.categories.map((category) => ({
          ...category,
          clues: category.clues.filter((_, index) => index !== rowIndex),
        })),
      }
    })
  }

  const removeCategory = (categoryId) => {
    setGame((previous) => {
      const nextCategories = previous.categories.filter((category) => category.id !== categoryId)
      return {
        ...previous,
        categories:
          nextCategories.length > 0
            ? nextCategories
            : [createEmptyCategory(0, previous.rowPoints)],
      }
    })
  }

  const updateCategoryName = (categoryId, name) => {
    setGame((previous) => ({
      ...previous,
      categories: previous.categories.map((category) =>
        category.id === categoryId ? { ...category, name } : category,
      ),
    }))
  }

  const addClue = (categoryId) => {
    addRow(categoryId)
  }

  const addColumn = addCategory

  const updateRowPoints = (rowIndex, points) => {
    setGame((previous) => {
      const nextRowPoints = previous.rowPoints.map((rowPoint, index) =>
        index === rowIndex ? points : rowPoint,
      )

      return {
        ...previous,
        rowPoints: nextRowPoints,
        categories: previous.categories.map((category) => ({
          ...category,
          clues: category.clues.map((clue, index) =>
            index === rowIndex ? { ...clue, points } : clue,
          ),
        })),
      }
    })
  }

  const removeClue = (categoryId, clueId) => {
    setGame((previous) => ({
      ...previous,
      categories: previous.categories.map((category) => {
        if (category.id !== categoryId) return category

        const clueIndex = category.clues.findIndex((clue) => clue.id === clueId)
        if (clueIndex === -1) return category

        const nextClues = category.clues.map((clue, index) =>
          index === clueIndex ? createEmptyClue(previous.rowPoints[clueIndex]) : clue,
        )

        return {
          ...category,
          clues: nextClues,
        }
      }),
    }))
  }

  const swapClueCells = (fromCategoryId, fromRowIndex, toCategoryId, toRowIndex) => {
    setGame((previous) => {
      if (
        !Number.isInteger(fromRowIndex) ||
        !Number.isInteger(toRowIndex) ||
        fromRowIndex < 0 ||
        toRowIndex < 0 ||
        fromRowIndex >= previous.rowPoints.length ||
        toRowIndex >= previous.rowPoints.length
      ) {
        return previous
      }

      const sourceCategoryIndex = previous.categories.findIndex((category) => category.id === fromCategoryId)
      const targetCategoryIndex = previous.categories.findIndex((category) => category.id === toCategoryId)

      if (sourceCategoryIndex === -1 || targetCategoryIndex === -1) {
        return previous
      }

      if (sourceCategoryIndex === targetCategoryIndex && fromRowIndex === toRowIndex) {
        return previous
      }

      const nextCategories = previous.categories.map((category) => ({
        ...category,
        clues: [...category.clues],
      }))

      const sourceCategory = nextCategories[sourceCategoryIndex]
      const targetCategory = nextCategories[targetCategoryIndex]

      while (sourceCategory.clues.length <= fromRowIndex) {
        const points = previous.rowPoints[sourceCategory.clues.length] ?? DEFAULT_POINTS_STEP
        sourceCategory.clues.push(createEmptyClue(points))
      }

      while (targetCategory.clues.length <= toRowIndex) {
        const points = previous.rowPoints[targetCategory.clues.length] ?? DEFAULT_POINTS_STEP
        targetCategory.clues.push(createEmptyClue(points))
      }

      const sourceClue = sourceCategory.clues[fromRowIndex]
      const targetClue = targetCategory.clues[toRowIndex]

      sourceCategory.clues[fromRowIndex] = {
        ...targetClue,
        points: previous.rowPoints[fromRowIndex],
      }
      targetCategory.clues[toRowIndex] = {
        ...sourceClue,
        points: previous.rowPoints[toRowIndex],
      }

      return {
        ...previous,
        categories: nextCategories,
      }
    })
  }

  const swapRows = (fromRowIndex, toRowIndex) => {
    setGame((previous) => {
      if (
        !Number.isInteger(fromRowIndex) ||
        !Number.isInteger(toRowIndex) ||
        fromRowIndex < 0 ||
        toRowIndex < 0 ||
        fromRowIndex >= previous.rowPoints.length ||
        toRowIndex >= previous.rowPoints.length ||
        fromRowIndex === toRowIndex
      ) {
        return previous
      }

      const nextRowPoints = [...previous.rowPoints]
      const tempPoints = nextRowPoints[fromRowIndex]
      nextRowPoints[fromRowIndex] = nextRowPoints[toRowIndex]
      nextRowPoints[toRowIndex] = tempPoints

      const nextCategories = previous.categories.map((category) => {
        const nextClues = [...category.clues]
        const tempClue = nextClues[fromRowIndex]
        nextClues[fromRowIndex] = nextClues[toRowIndex]
        nextClues[toRowIndex] = tempClue
        return {
          ...category,
          clues: nextClues,
        }
      })

      return {
        ...previous,
        rowPoints: nextRowPoints,
        categories: nextCategories,
      }
    })
  }

  const swapCategories = (fromCategoryIndex, toCategoryIndex) => {
    setGame((previous) => {
      if (
        !Number.isInteger(fromCategoryIndex) ||
        !Number.isInteger(toCategoryIndex) ||
        fromCategoryIndex < 0 ||
        toCategoryIndex < 0 ||
        fromCategoryIndex >= previous.categories.length ||
        toCategoryIndex >= previous.categories.length ||
        fromCategoryIndex === toCategoryIndex
      ) {
        return previous
      }

      const nextCategories = [...previous.categories]
      const tempCategory = nextCategories[fromCategoryIndex]
      nextCategories[fromCategoryIndex] = nextCategories[toCategoryIndex]
      nextCategories[toCategoryIndex] = tempCategory

      return {
        ...previous,
        categories: nextCategories,
      }
    })
  }

  const updateClue = (categoryId, clueId, patch) => {
    setGame((previous) => ({
      ...previous,
      categories: previous.categories.map((category) => {
        if (category.id !== categoryId) return category

        return {
          ...category,
          clues: category.clues.map((clue) => (clue.id === clueId ? { ...clue, ...patch } : clue)),
        }
      }),
    }))
  }

  const clearClueImage = (categoryId, clueId) => {
    updateClue(categoryId, clueId, { imageBase64: '' })
  }

  const ensureCell = (categoryId, rowIndex) => {
    setGame((previous) => ({
      ...previous,
      categories: previous.categories.map((category) => {
        if (category.id !== categoryId) return category

        if (category.clues[rowIndex]) {
          return category
        }

        const clues = [...category.clues]
        while (clues.length <= rowIndex) {
          const nextPoints = previous.rowPoints[clues.length] ?? (clues.length + 1) * DEFAULT_POINTS_STEP
          clues.push(createEmptyClue(nextPoints))
        }

        return { ...category, clues }
      }),
    }))
  }

  const value = useMemo(
    () => ({
      game,
      setGame,
      setGameTitle,
      addCategory,
      addColumn,
      addRow,
      removeRow,
      removeCategory,
      updateCategoryName,
      addClue,
      removeClue,
      swapClueCells,
      swapRows,
      swapCategories,
      updateClue,
      updateRowPoints,
      clearClueImage,
      ensureCell,
    }),
    [game],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }

  return context
}

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Failed to convert image to Base64'))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function exportGameAsJson(game) {
  const fileContent = JSON.stringify(game, null, 2)
  const blob = new Blob([fileContent], { type: 'application/json' })
  const objectUrl = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `${sanitizeFileName(game.title || 'jeopardy-game')}.json`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(objectUrl)
}

export async function importGameFromFile(file) {
  const rawText = await file.text()
  const parsed = JSON.parse(rawText)
  return normalizeGame(parsed)
}

function normalizeGame(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid game object')
  }

  const categories = Array.isArray(raw.categories)
    ? raw.categories
        .filter((category) => category && typeof category === 'object')
        .map((category, categoryIndex) => normalizeCategory(category, categoryIndex))
    : []

  const rowCount = Math.max(DEFAULT_ROW_COUNT, ...categories.map((category) => category.clues.length))
  const rowPoints = normalizeRowPoints(raw.rowPoints, rowCount, categories)

  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    title: typeof raw.title === 'string' ? raw.title : 'Imported Jeopardy Game',
    rowPoints,
    categories:
      categories.length > 0
        ? categories.map((category, categoryIndex) => ({
            ...category,
            clues: ensureRowCount(category.clues, rowPoints),
          }))
        : Array.from({ length: DEFAULT_CATEGORY_COUNT }, (_, categoryIndex) =>
            createCategoryWithRows(categoryIndex, rowPoints),
          ),
  }
}

function normalizeCategory(rawCategory, categoryIndex) {
  const clues = Array.isArray(rawCategory.clues)
    ? rawCategory.clues
        .filter((clue) => clue && typeof clue === 'object')
        .map((clue, clueIndex) => normalizeClue(clue, clueIndex))
    : []

  return {
    id: typeof rawCategory.id === 'string' ? rawCategory.id : crypto.randomUUID(),
    name:
      typeof rawCategory.name === 'string' && rawCategory.name.trim().length > 0
        ? rawCategory.name
        : `Category ${categoryIndex + 1}`,
    clues: clues.length > 0 ? clues : createDefaultRowPoints().map((points) => createEmptyClue(points)),
  }
}

function normalizeClue(rawClue, clueIndex) {
  const points = Number(rawClue.points)

  return {
    id: typeof rawClue.id === 'string' ? rawClue.id : crypto.randomUUID(),
    points: Number.isFinite(points) ? points : (clueIndex + 1) * DEFAULT_POINTS_STEP,
    question: typeof rawClue.question === 'string' ? rawClue.question : '',
    answer: typeof rawClue.answer === 'string' ? rawClue.answer : '',
    imageBase64: typeof rawClue.imageBase64 === 'string' ? rawClue.imageBase64 : '',
  }
}

function sanitizeFileName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ensureRowCount(clues, rowPoints) {
  const nextClues = [...clues]
  while (nextClues.length < rowPoints.length) {
    nextClues.push(createEmptyClue(rowPoints[nextClues.length] ?? DEFAULT_POINTS_STEP))
  }
  return nextClues.map((clue, index) => ({
    ...clue,
    points: rowPoints[index] ?? clue.points ?? (index + 1) * DEFAULT_POINTS_STEP,
  }))
}

function normalizeRowPoints(rawRowPoints, rowCount, categories) {
  const fromRaw = Array.isArray(rawRowPoints)
    ? rawRowPoints.map((value, index) => {
        const points = Number(value)
        return Number.isFinite(points) ? points : (index + 1) * DEFAULT_POINTS_STEP
      })
    : []

  if (fromRaw.length > 0) {
    while (fromRaw.length < rowCount) {
      fromRaw.push((fromRaw.length + 1) * DEFAULT_POINTS_STEP)
    }
    return fromRaw.slice(0, rowCount)
  }

  const inferred = Array.from({ length: rowCount }, (_, index) => {
    const pointsFromClues = categories
      .map((category) => category.clues[index]?.points)
      .find((points) => Number.isFinite(Number(points)))

    const numericPoints = Number(pointsFromClues)
    return Number.isFinite(numericPoints) ? numericPoints : (index + 1) * DEFAULT_POINTS_STEP
  })

  return inferred
}

function createCategoryWithRows(index, rowPoints) {
  return {
    id: crypto.randomUUID(),
    name: `Category ${index + 1}`,
    clues: rowPoints.map((points) => createEmptyClue(points)),
  }
}
