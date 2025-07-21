"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Use dynamic import for Image component to prevent hydration mismatch
const DynamicImage = dynamic(() => import("next/image"), {
  ssr: true,
  loading: () => (
    <div className="animate-pulse bg-gray-200 rounded-lg" style={{ width: "150px", height: "150px" }}></div>
  ),
})

const layoutOptions = [
  "Layout 1",
  "Layout 2",
  "Layout 3",
  "Layout 4",
  "Layout 5",
  "Layout 6",
  "Layout 7",
  "Layout 8",
  "Layout 9",
  "Layout 10",
]

const headerFontStyles = [
  { name: "Default" },
  { name: "Arial" },
  { name: "Times New Roman" },
  { name: "Courier New" },
  { name: "Verdana" },
  { name: "Georgia" },
]

export default function PaperPreview() {
  // Group all useState declarations at the top
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState(null)
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [selectedExercises, setSelectedExercises] = useState([])
  const [showQuestionMenu, setShowQuestionMenu] = useState(false)
  const [searchedQuestions, setSearchedQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [questionType, setQuestionType] = useState("")
  const [selectionSource, setSelectionSource] = useState("")
  const [requiredCount, setRequiredCount] = useState(0)
  const [medium, setMedium] = useState("")
  const [choiceNumber, setChoiceNumber] = useState(0)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set())
  const [paperSettings, setPaperSettings] = useState({
    paperHeaderLayout: "Layout 1",
    headerFontStyle: "Default",
    headerFontSize: "18",
    headerFontColor: "Black",
    headingFontStyle: "Default",
    headingFontSize: "16",
    headingFontColor: "Black",
    textFontSize: "12",
    paperFontColor: "Black",
    textFontColor: "Black",
    englishTextFontStyle: "Default",
    urduTextFontStyle: "Default",
    lineHeight: "1.5",
    shortQuestionLineHeight: "1.2",
    longQuestionLineHeight: "1.2",
    textFormatting: "Normal",
    watermark: "No Watermark",
    pinWatermarkOpacity: "0.1",
    logoHeight: "150",
    logoWidth: "150",
    headerPosition: "left",
    headerVerticalAlign: "top",
    headerMargin: "8",
    logoMarginTop: "10",
    logoMarginRight: "20",
    logoMarginBottom: "10",
    logoMarginLeft: "10",
    headerContentMarginTop: "10",
    headerContentMarginRight: "10",
    headerContentMarginBottom: "10",
    headerContentMarginLeft: "10",
    showChapterName: false,
    showQuestionBorder: true,
    class: "9th",
    subject: "Biology",
    maximumMarks: "",
    studentName: "Ahmad Fareed",
    section: "",
    rollNo: "",
    time: "",
    paperType: "",
    obtainedMarks: "",
  })
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [randomSelectedQuestions, setRandomSelectedQuestionsState] = useState([])
  const [isSelectionMode, setIsSelectionModeState] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: "", type: "info" })
  const [isSaving, setIsSaving] = useState(false)
  const [allQuestions, setAllQuestions] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [questionsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false) // New state to track if search has been performed

  // Update useEffect to handle all settings
  useEffect(() => {
    setIsClient(true)

    // Retrieve selected exercises from localStorage
    const savedExercises = localStorage.getItem("selectedBiologyExercises")
    if (savedExercises) {
      try {
        const parsedExercises = JSON.parse(savedExercises)
        setSelectedExercises(parsedExercises)
      } catch (error) {
        console.error("Error parsing selected exercises:", error)
      }
    }
  }, [])

  useEffect(() => {
    const handleError = (error) => {
      console.error("Preview page error:", error)
      setError("Unable to load the preview. Please try again.")
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("paperDefaultSettings")
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setPaperSettings((prev) => ({
          ...prev,
          ...parsedSettings,
        }))
      }
    }
  }, [])

  useEffect(() => {
    // Add a listener for the beforeprint event to prepare the document
    const handleBeforePrint = () => {
      document.body.classList.add("print-mode")
      document.body.style.display = "none"
      setTimeout(() => {
        document.body.style.display = ""
      }, 10)
    }

    // Add a listener for the afterprint event to clean up
    const handleAfterPrint = () => {
      document.body.classList.remove("print-mode")
    }

    window.addEventListener("beforeprint", handleBeforePrint)
    window.addEventListener("afterprint", handleAfterPrint)

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint)
      window.removeEventListener("afterprint", handleAfterPrint)
    }
  }, [])

  useEffect(() => {
    if (selectedQuestions.length > 0) {
      const totalMarks = calculatePaperTotalMarks()
      setPaperSettings((prev) => ({
        ...prev,
        maximumMarks: totalMarks.toString(),
      }))
    }
  }, [selectedQuestions, choiceNumber])

  // Now we can have conditional returns
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-pulse bg-white p-8 rounded-xl shadow-lg">
          <div className="w-64 h-4 bg-gray-200 rounded mb-4"></div>
          <div className="w-48 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  // Updated getTextStyle function to handle all three text types correctly
  const getTextStyle = (type = "normal") => {
    switch (type) {
      case "header":
        return {
          fontFamily: paperSettings.headerFontStyle === "Default" ? "system-ui" : paperSettings.headerFontStyle,
          fontSize: `${Number.parseInt(paperSettings.headerFontSize)}px`,
          color: paperSettings.headerFontColor || paperSettings.paperFontColor,
        }
      case "heading":
        return {
          fontFamily: paperSettings.headingFontStyle,
          fontSize: `${paperSettings.headingFontSize}px`,
          color: paperSettings.headingFontColor || paperSettings.paperFontColor,
          fontWeight: "bold",
        }
      default:
        return {
          fontFamily:
            paperSettings.englishTextFontStyle === "Default" ? "system-ui" : paperSettings.englishTextFontStyle,
          fontSize: `${paperSettings.textFontSize}px`,
          color: paperSettings.textFontColor || paperSettings.paperFontColor,
          lineHeight: paperSettings.lineHeight,
          fontWeight: paperSettings.textFormatting === "Bold" ? "bold" : "normal",
          fontStyle: paperSettings.textFormatting === "Italic" ? "italic" : "normal",
          fontVariant: paperSettings.textFormatting === "Small Caps" ? "small-caps" : "normal",
        }
    }
  }

  // Get question text style specifically for question text
  const getQuestionTextStyle = (questionType = "mcqs") => {
    const baseStyle = {
      fontFamily: paperSettings.englishTextFontStyle === "Default" ? "system-ui" : paperSettings.englishTextFontStyle,
      fontSize: `${paperSettings.textFontSize}px`,
      color: paperSettings.textFontColor || paperSettings.paperFontColor,
      fontWeight: paperSettings.textFormatting === "Bold" ? "bold" : "normal",
      fontStyle: paperSettings.textFormatting === "Italic" ? "italic" : "normal",
      fontVariant: paperSettings.textFormatting === "Small Caps" ? "small-caps" : "normal",
    }

    // Apply different line heights based on question type
    switch (questionType) {
      case "short":
        return { ...baseStyle, lineHeight: paperSettings.shortQuestionLineHeight }
      case "long":
        return { ...baseStyle, lineHeight: paperSettings.longQuestionLineHeight }
      default:
        return { ...baseStyle, lineHeight: paperSettings.lineHeight }
    }
  }

  // Update handleRandomSelect function
  const handleRandomSelect = () => {
    if (!requiredCount || requiredCount <= 0) {
      setNotification({
        show: true,
        message: "Please specify the number of questions required",
        type: "error",
      })
      setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 3000)
      return
    }

    if (searchedQuestions.length === 0) {
      setNotification({
        show: true,
        message: "Please search for questions first",
        type: "error",
      })
      setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 3000)
      return
    }

    const count = Math.min(Number.parseInt(requiredCount), searchedQuestions.length)
    const shuffled = [...searchedQuestions].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, count)
    setRandomSelectedQuestionsState(selected)
    setSelectedQuestionIds(new Set(selected.map((q) => q.id)))
    setIsSelectionModeState(false)
  }

  const handleAddSelection = () => {
    const selectedQuestions = searchedQuestions.filter((q) => selectedQuestionIds.has(q.id))
    setSelectedQuestions((prev) => {
      const updatedQuestions = [...prev, ...selectedQuestions]

      // Update maximum marks based on the new total
      const newTotalMarks = calculatePaperTotalMarks()
      setPaperSettings((prev) => ({
        ...prev,
        maximumMarks: newTotalMarks.toString(),
      }))

      return updatedQuestions
    })
    setSelectedQuestionIds(new Set())
    setIsSelectionModeState(false)
    setShowQuestionMenu(false)
  }

  const handleQuestionMenuClick = () => {
    setShowQuestionMenu(true)
  }

  // Replace the handleSearchQuestions function with this optimized version:
  const handleSearchQuestions = async () => {
    setLoading(true)
    setHasSearched(true) // Set hasSearched to true when search is performed

    try {
      const apiUrl = "https://edu.largifysolutions.com/api-questions.php"

      // First get the count with filters
      const countParams = new URLSearchParams({
        class: paperSettings.class,
        subject: paperSettings.subject,
        count_only: "true",
      })

      // Add optional filters
      if (selectedExercises && selectedExercises.length > 0) {
        countParams.append("topic", selectedExercises.join(","))
      }

      if (questionType) {
        countParams.append("type", questionType.toLowerCase())
      }

      if (selectionSource) {
        countParams.append("source", selectionSource)
      }

      if (medium) {
        countParams.append("medium", medium)
      }

      // Add a timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      try {
        const countResponse = await fetch(`${apiUrl}?${countParams}`, {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!countResponse.ok) {
          throw new Error(`API returned ${countResponse.status}: ${countResponse.statusText}`)
        }

        const countData = await countResponse.json()
        const totalCount = Number.parseInt(countData.count || 0)
        const calculatedTotalPages = Math.ceil(totalCount / questionsPerPage)
        setTotalPages(calculatedTotalPages || 1)

        // Now fetch the first page with filters
        const fetchParams = new URLSearchParams({
          class: paperSettings.class,
          subject: paperSettings.subject,
          limit: questionsPerPage.toString(),
          offset: "0",
        })

        // Add the same filters
        if (selectedExercises && selectedExercises.length > 0) {
          fetchParams.append("topic", selectedExercises.join(","))
        }

        if (questionType) {
          fetchParams.append("type", questionType.toLowerCase())
        }

        if (selectionSource) {
          fetchParams.append("source", selectionSource)
        }

        if (medium) {
          fetchParams.append("medium", medium)
        }

        const responseController = new AbortController()
        const responseTimeoutId = setTimeout(() => responseController.abort(), 15000) // 15 second timeout

        const response = await fetch(`${apiUrl}?${fetchParams}`, {
          signal: responseController.signal,
        })
        clearTimeout(responseTimeoutId)

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setSearchedQuestions(data)
        setCurrentPage(1)
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          throw new Error("Request timed out. The server might be overloaded.")
        } else {
          throw fetchError
        }
      }
    } catch (error) {
      console.error("Error in search:", error)
      setNotification({
        show: true,
        message: `Failed to fetch questions: ${error.message}`,
        type: "error",
      })
      setSearchedQuestions([])
    } finally {
      setLoading(false)
    }
  }

  // Add this new function for handling question toggle
  const handleQuestionToggle = (questionId) => {
    if (!isSelectionMode) return

    const newSelectedIds = new Set(selectedQuestionIds)
    if (newSelectedIds.has(questionId)) {
      newSelectedIds.delete(questionId)
    } else if (newSelectedIds.size < Number.parseInt(requiredCount)) {
      newSelectedIds.add(questionId)
    } else {
      setNotification({
        show: true,
        message: `You can only select up to ${requiredCount} questions`,
        type: "warning",
      })
      setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 3000)
      return
    }
    setSelectedQuestionIds(newSelectedIds)
  }

  const handleEditClick = () => {
    setShowEditPanel(!showEditPanel)
  }

  // Add this function after the handleEditClick function
  const handlePrintClick = () => {
    // Get the paper content and questions content
    const paperContainer = document.querySelector(".paper-container")
    const questionsContent = document.querySelector(".mt-8.pl-16")

    if (!paperContainer || !questionsContent) {
      alert("Could not find paper content to print")
      return
    }

    // Create a new window with specific dimensions matching A4 paper
    const printWindow = window.open("", "_blank", "width=830,height=1170")

    if (!printWindow) {
      alert("Please allow pop-ups to use the print functionality")
      return
    }

    // Get all stylesheets from the current document
    const styleSheets = Array.from(document.styleSheets)
    let styles = ""

    // Extract styles from all stylesheets
    styleSheets.forEach((sheet) => {
      try {
        const cssRules = sheet.cssRules || sheet.rules
        if (cssRules) {
          for (let i = 0; i < cssRules.length; i++) {
            styles += cssRules[i].cssText + "\n"
          }
        }
      } catch (e) {
        // Some stylesheets may not be accessible due to CORS
        console.log("Could not access stylesheet", e)
      }
    })

    // Add specific print styles
    const printStyles = `
  @page {
    size: A4;
    margin: 0.5cm;
  }
  body {
    margin: 0;
    padding: 0;
    background: white;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .paper-container {
    width: 21cm;
    padding: 0;
    margin: 0 auto;
    background-color: white;
    box-shadow: none;
    border: none;
    border-radius: 0;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  @media print {
    html, body {
      width: 210mm;
      height: 297mm;
    }
    .paper-container {
      width: 100%;
      box-shadow: none;
      border: none;
    }
    /* Force background colors and images to print */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
  /* Ensure header and questions appear on the same page */
  #print-container {
    display: flex;
    flex-direction: column;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
    page-break-before: avoid !important;
  }
  /* Remove any spacing between header and questions */
  #print-container > .mt-8.pl-16 {
    margin-top: 0 !important;
    padding-top: 0 !important;
    page-break-before: avoid !important;
  }
  /* Fix the page break issue */
  .paper-container > div:last-child {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
  }
  /* Ensure no page breaks within content */
  .question-section {
    page-break-inside: avoid !important;
  }
`

    // Clone the paper container and questions content
    const clonedPaperContent = paperContainer.cloneNode(true)
    const clonedQuestionsContent = questionsContent.cloneNode(true)

    // Write the content to the new window
    printWindow.document.write(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>Print Paper</title>
      <style>${styles}</style>
      <style>${printStyles}</style>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div id="print-container" style="width: 21cm; margin: 0 auto;">
        ${clonedPaperContent.outerHTML}
        ${clonedQuestionsContent.outerHTML}
      </div>
      <script>
        // Wait for all resources to load
        window.onload = function() {
          // Give a little extra time for rendering
          setTimeout(function() {
            // Remove any spacing between elements
            const questionsContent = document.querySelector('.mt-8.pl-16');
            const paperContainer = document.querySelector('.paper-container');
            
            if (questionsContent) {
              questionsContent.style.marginTop = '0';
              questionsContent.style.paddingTop = '0';
              questionsContent.style.pageBreakBefore = 'avoid';
            }
            
            if (paperContainer) {
              const lastChild = paperContainer.lastElementChild;
              if (lastChild) {
                lastChild.style.marginBottom = '0';
                lastChild.style.paddingBottom = '0';
              }
              paperContainer.style.pageBreakAfter = 'avoid';
              paperContainer.style.pageBreakInside = 'avoid';
            }
            
            // Force layout recalculation
            document.body.style.display = 'none';
            setTimeout(() => {
              document.body.style.display = '';
              window.print();
            }, 100);
          }, 500);
        };
      </script>
    </body>
  </html>
`)

    printWindow.document.close()
  }

  // Add a new function to handle saving the paper after the handlePrintClick function:
  // Replace the handleSavePaper function with this improved version
  const handleSavePaper = async () => {
    try {
      console.log("Starting save paper operation")
      setIsSaving(true)

      // Prepare the paper content (HTML and styles)
      const paperContainer = document.querySelector(".paper-container")
      const questionsContent = document.querySelector(".mt-8.pl-16")

      if (!paperContainer || !questionsContent) {
        console.error("Could not find paper content elements")
        setNotification({
          show: true,
          message: "Could not find paper content to save",
          type: "error",
        })
        setIsSaving(false)
        return
      }

      // Create a smaller payload by only sending essential data
      const paperData = {
        class: paperSettings.class || "9th",
        subject: paperSettings.subject || "Biology",
        // Store minimal content to reduce payload size
        content: JSON.stringify({
          paperSettings: paperSettings,
          selectedQuestions: selectedQuestions.map((q) => ({
            id: q.id,
            type: q.type,
            text: q.text,
            options: q.options,
            marks: q.marks,
          })),
        }),
        status: "SAVED",
        created_at: new Date().toISOString(),
      }

      console.log("Paper data prepared for sending")

      // Add a timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout for saving

      try {
        // Make the API request with JSON format
        const response = await fetch("https://edu.largifysolutions.com/api-papers.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paperData),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        console.log("API response status:", response.status)

        // Try to get the response text to see what the error might be
        const responseText = await response.text()
        console.log("API response text:", responseText)

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}. ${responseText || ""}`)
        }

        setNotification({
          show: true,
          message: "Paper saved successfully!",
          type: "success",
        })
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          throw new Error("Request timed out. The server might be overloaded.")
        } else {
          throw fetchError
        }
      }
    } catch (error) {
      console.error("Error saving paper:", error)
      setNotification({
        show: true,
        message: `Failed to save paper: ${error.message || "Unknown error"}`,
        type: "error",
      })
    } finally {
      setIsSaving(false)
      setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 5000)
    }
  }

  // Helper functions
  function getHeaderLayoutClass(layout) {
    const layouts = {
      "Layout 1": "flex flex-col", // Default stacked layout
      "Layout 2": "flex flex-col items-center", // Centered stacked layout
      "Layout 3": "grid grid-cols-1", // Full width banner style
      "Layout 4": "flex flex-col bg-gradient-to-r from-violet-50 to-indigo-50", // Gradient background
      "Layout 5": "flex flex-col rounded-t-lg overflow-hidden", // Rounded top corners
      "Layout 6": "flex flex-col border-2 border-violet-200 rounded-lg", // Bordered box
      "Layout 7": "flex flex-col bg-white shadow-lg", // Shadowed box
      "Layout 8": "flex flex-col bg-violet-50", // Colored background
      "Layout 9": "flex flex-col border-b-4 border-violet-500", // Bottom border accent
      "Layout 10": "flex flex-col bg-gradient-to-br from-white to-violet-50", // Diagonal gradient
    }
    return layouts[layout] || layouts["Layout 1"]
  }

  // Update the getLogoPositionClasses function to getHeaderPositionClasses
  function getHeaderPositionClasses() {
    const positionClasses = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    }

    const verticalClasses = {
      top: "items-start",
      middle: "items-center",
      bottom: "items-end",
    }

    return `${positionClasses[paperSettings.headerPosition] || "justify-start"} ${verticalClasses[paperSettings.headerVerticalAlign] || "items-center"}`
  }

  function getMcqLayoutClass(layout) {
    const layouts = {
      horizontal: "flex gap-8",
      vertical: "flex flex-col gap-2",
      grid: "grid grid-cols-2 gap-4",
    }
    return layouts[layout] || layouts["horizontal"]
  }

  function getQuestionNumber(index, type) {
    if (type === "roman") return `${toRoman(index)}.`
    if (type === "alphabet") return `${String.fromCharCode(96 + index)})`
    return `${index}.`
  }

  function renderAnswerSpace(type, lines) {
    const styles = {
      single: "border-b border-gray-300",
      double: "border-b-2 border-gray-300",
      box: "border border-gray-300 rounded",
      lined: "lined-paper",
      grid: "grid-paper",
    }
    return <div className={`mt-4 h-${lines * 6} ${styles[type]}`}></div>
  }

  function toRoman(num) {
    const romanNumerals = {
      1: "I",
      2: "II",
      3: "III",
      4: "IV",
      5: "V",
      6: "VI",
      7: "VII",
      8: "VIII",
      9: "IX",
      10: "X",
    }
    return romanNumerals[num] || num.toString()
  }

  // Create a header style with explicit font size
  const headerTextStyle = {
    fontSize: `${Number.parseInt(paperSettings.headerFontSize)}px`,
    fontFamily: paperSettings.headerFontStyle === "Default" ? "system-ui" : paperSettings.headerFontStyle,
    color: paperSettings.headerFontColor || paperSettings.paperFontColor,
  }

  // First, add a function to group questions by type and calculate marks
  const groupQuestionsByType = (questions) => {
    const grouped = {
      mcqs: [],
      short: [],
      long: [],
    }

    questions.forEach((question) => {
      if (grouped[question.type]) {
        grouped[question.type].push(question)
      }
    })

    return grouped
  }

  // Modify the getHeadingTextByType function to use the choice number
  const getHeadingTextByType = (type) => {
    switch (type) {
      case "mcqs":
        return "Choose the correct option."
      case "short": {
        // Get the total number of short questions
        const shortQuestions = selectedQuestions.filter((q) => q.type === "short")
        const totalShortQuestions = shortQuestions.length

        // If choice is set and there are questions, calculate heading number as total - choice
        if (choiceNumber > 0 && totalShortQuestions > 0) {
          const headingNumber = Math.max(1, totalShortQuestions - choiceNumber)
          return `ATTEMPT ANY ${headingNumber} OF THE FOLLOWING`
        }
        // Default to 5 if no choice or no questions
        return "ATTEMPT ANY 5 OF THE FOLLOWING"
      }
      case "long": {
        // Get the total number of long questions
        const longQuestions = selectedQuestions.filter((q) => q.type === "long")
        const totalLongQuestions = longQuestions.length

        // If choice is set and there are questions, calculate heading number as total - choice
        if (choiceNumber > 0 && totalLongQuestions > 0) {
          const headingNumber = Math.max(1, totalLongQuestions - choiceNumber)
          return `ATTEMPT ANY ${headingNumber} OF THE FOLLOWING`
        }
        // Default to 2 if no choice or no questions
        return "ATTEMPT ANY 2 OF THE FOLLOWING"
      }
      default:
        return ""
    }
  }

  // Update the getMarksPerQuestion function to calculate total marks based on choice
  const getMarksPerQuestion = (type) => {
    switch (type) {
      case "mcqs":
        return 1
      case "short":
        return 2
      case "long":
        return 5
      default:
        return 0
    }
  }

  // Add a new function to calculate total marks based on choice number
  const calculateTotalMarks = (questions, type) => {
    const marksPerQuestion = getMarksPerQuestion(type)
    // If choice number is set and less than total questions, use choice for calculation
    if (choiceNumber > 0 && choiceNumber < questions.length) {
      return choiceNumber * marksPerQuestion
    }
    // Otherwise use the total number of questions
    return questions.length * marksPerQuestion
  }

  // Add a new function to calculate the total marks for the entire paper
  const calculatePaperTotalMarks = () => {
    let totalMarks = 0

    // Get grouped questions
    const grouped = groupQuestionsByType(selectedQuestions)

    // Calculate marks for each section
    Object.entries(grouped).forEach(([type, questions]) => {
      const marksPerQuestion = getMarksPerQuestion(type)

      // If choice number is set and less than total questions, use choice for calculation
      if (type === "short" || type === "long") {
        if (choiceNumber > 0 && choiceNumber < questions.length) {
          const headingNumber = Math.max(1, questions.length - choiceNumber)
          totalMarks += headingNumber * marksPerQuestion
        } else {
          totalMarks += questions.length * marksPerQuestion
        }
      }
    })

    return totalMarks
  }

  // Function to check if text already starts with a number
  const startsWithNumber = (text) => {
    return /^\d+\.?\s/.test(text)
  }

  // Function to strip leading number from text if it exists
  const stripLeadingNumber = (text) => {
    return text.replace(/^\d+\.?\s/, "")
  }

  // Function to determine and render the appropriate layout for MCQ options based on their length
  const determineOptionLayout = (options) => {
    // Check if any option is longer than a certain threshold
    const hasLongOptions = options.some((option) => option.length > 25)
    const hasVeryLongOptions = options.some((option) => option.length > 50)

    if (hasVeryLongOptions) {
      // Stack layout (1 per row) for very long options
      return (
        <div className="flex flex-col space-y-3">
          {options.map((option, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="font-medium mt-0.5 w-8 text-right">({String.fromCharCode(65 + idx)})</span>
              <span className="text-gray-600" style={getQuestionTextStyle("mcqs")}>
                {option}
              </span>
            </div>
          ))}
        </div>
      )
    } else if (hasLongOptions) {
      // Grid layout (2x2) for moderately long options
      return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {options.map((option, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="font-medium mt-0.5 w-8 text-right">({String.fromCharCode(65 + idx)})</span>
              <span className="text-gray-600" style={getQuestionTextStyle("mcqs")}>
                {option}
              </span>
            </div>
          ))}
        </div>
      )
    } else {
      // Horizontal layout with even spacing for short options
      return (
        <div className="flex justify-between pr-8">
          {options.map((option, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-medium w-8 text-right">({String.fromCharCode(65 + idx)})</span>
              <span className="text-gray-600" style={getQuestionTextStyle("mcqs")}>
                {option}
              </span>
            </div>
          ))}
        </div>
      )
    }
  }

  // And replace the loadPage function with this optimized version:
  const loadPage = async (page) => {
    try {
      setIsLoading(true)
      const offset = (page - 1) * questionsPerPage

      // Get selected exercises from localStorage
      const savedExercises = localStorage.getItem("selectedBiologyExercises")
      let selectedTopics = []

      if (savedExercises) {
        try {
          selectedTopics = JSON.parse(savedExercises)
        } catch (error) {
          console.error("Error parsing selected exercises:", error)
        }
      }

      const fetchParams = new URLSearchParams({
        class: "9th",
        subject: "Biology",
        limit: questionsPerPage.toString(),
        offset: offset.toString(),
      })

      if (selectedTopics && selectedTopics.length > 0) {
        fetchParams.append("topic", selectedTopics.join(","))
      }

      // Add filters if they exist
      if (questionType) {
        fetchParams.append("type", questionType.toLowerCase())
      }

      if (selectionSource) {
        fetchParams.append("source", selectionSource)
      }

      if (medium) {
        fetchParams.append("medium", medium)
      }

      const apiUrl = "https://edu.largifysolutions.com/api-questions.php"

      // Add a timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      try {
        const response = await fetch(`${apiUrl}?${fetchParams}`, {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setSearchedQuestions(data)
        setCurrentPage(page)
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          throw new Error("Request timed out. The server might be overloaded.")
        } else {
          throw fetchError
        }
      }
    } catch (error) {
      console.error("Error loading page:", error)
      setNotification({
        show: true,
        message: `Failed to load questions: ${error.message}`,
        type: "error",
      })
      setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <div className="bg-white shadow-lg p-2">
        <div className="max-w-7xl mx-auto flex gap-2">
          <div
            onClick={handleQuestionMenuClick}
            className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center justify-center space-x-2 px-2 py-2">
              <span className="material-symbols-outlined text-sm text-white"></span>
              <span className="font-semibold text-white tracking-wide whitespace-nowrap text-xs">Question's Menu</span>
            </div>
          </div>
          {/* Apply the same changes to other buttons */}
          <div
            onClick={handleEditClick}
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center justify-center space-x-3 px-6 py-4">
              <span className="material-symbols-outlined text-2xl text-white"></span>
              <span className="font-semibold text-white tracking-wide whitespace-nowrap">Edit Paper</span>
            </div>
          </div>
          <div
            onClick={handlePrintClick}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center justify-center space-x-3 px-6 py-4">
              <span className="material-symbols-outlined text-2xl text-white"></span>
              <span className="font-semibold text-white tracking-wide whitespace-nowrap">Print Paper</span>
            </div>
          </div>
          {/* Update the Save Paper button in the navigation bar to call the new function: */}
          <div
            onClick={(e) => {
              e.preventDefault()
              console.log("Save Paper button clicked")
              handleSavePaper()
            }}
            className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center justify-center space-x-3 px-6 py-4">
              <span className="material-symbols-outlined text-2xl text-white"></span>
              <span className="font-semibold text-white tracking-wide whitespace-nowrap">
                {isSaving ? "Saving..." : "Save Paper"}
              </span>
            </div>
          </div>
          <div className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer">
            <div className="flex items-center justify-center space-x-3 px-6 py-4">
              <span className="material-symbols-outlined text-2xl text-white"></span>
              <span className="font-semibold text-white tracking-wide whitespace-nowrap">Cancel Paper</span>
            </div>
          </div>
        </div>
      </div>
      {/* 5. Add the notification component to the JSX, right after the navigation bar */}
      {notification.show && (
        <div
          className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 ${
            notification.type === "error"
              ? "bg-red-100 border-l-4 border-red-500 text-red-700"
              : notification.type === "success"
                ? "bg-green-100 border-l-4 border-green-500 text-green-700"
                : notification.type === "warning"
                  ? "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700"
                  : "bg-blue-100 border-l-4 border-blue-500 text-blue-700"
          }`}
        >
          <div className="flex items-center">
            <div className="py-1">
              <svg
                className={`fill-current h-6 w-6 mr-4 ${
                  notification.type === "error"
                    ? "text-red-500"
                    : notification.type === "success"
                      ? "text-green-500"
                      : notification.type === "warning"
                        ? "text-yellow-500"
                        : "text-blue-500"
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                {notification.type === "error" && (
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                )}
                {notification.type === "success" && (
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                )}
                {notification.type === "warning" && (
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-7a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm0-5a1 1 0 100 2 1 1 0 000-2z" />
                )}
                {notification.type === "info" && (
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-7a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm0-5a1 1 0 100 2 1 1 0 000-2z" />
                )}
              </svg>
            </div>
            <div>
              <p className="font-bold">{notification.message}</p>
            </div>
          </div>
        </div>
      )}
      {/* Question Menu Modal */}
      {showQuestionMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50/95 to-slate-100/95 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-[98%] max-w-[1920px] shadow-2xl border border-violet-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white px-4 py-2.5 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-3">
                <span className="text-base font-medium">Select All Chapters</span>
                <span className="text-base bg-white/20 px-3 py-0.5 rounded-full">9th - Biology</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowQuestionMenu(false)}
                  className="text-white/90 hover:text-white text-2xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Main Content - keeping the same structure but updating colors */}
            <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
              {/* Control Panel */}
              <div className="flex flex-col gap-3 bg-white p-4 rounded-xl shadow-sm border border-violet-100">
                {/* First Row */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white px-4 py-2 text-sm rounded-lg flex items-center font-medium shadow-sm col-span-2">
                    Question Type
                  </div>
                  <div className="col-span-3">
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value)}
                      className="w-full border border-violet-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    >
                      <option value="">Select Type</option>
                      <option value="long">Long Questions</option>
                      <option value="short">Short Questions</option>
                      <option value="mcqs">MCQs</option>
                    </select>
                  </div>
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white px-4 py-2 text-sm">
                    Selection
                  </div>
                  <div className="col-span-2">
                    <select
                      value={selectionSource}
                      onChange={(e) => setSelectionSource(e.target.value)}
                      className="w-full border border-violet-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    >
                      <option value="">Select Source</option>
                      <option value="exercise">Exercise</option>
                      <option value="additional">Additional</option>
                      <option value="pastPapers">Past Papers</option>
                      <option value="conceptual">Conceptual</option>
                    </select>
                  </div>
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white px-4 py-2 text-sm rounded-lg flex items-center font-medium shadow-sm">
                    Required
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      value={requiredCount}
                      onChange={(e) => setRequiredCount(e.target.value)}
                      className="w-full border border-violet-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    />
                  </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3">
                    <select
                      value={medium}
                      onChange={(e) => setMedium(e.target.value)}
                      className="w-full border border-violet-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    >
                      <option value="">Select Medium</option>
                      <option value="DUAL MEDIUM">DUAL MEDIUM</option>
                      <option value="ENGLISH MEDIUM">ENGLISH MEDIUM</option>
                      <option value="URDU MEDIUM">URDU MEDIUM</option>
                    </select>
                  </div>
                  {/* Update the choice input in the second row of the control panel */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Choice"
                      value={choiceNumber}
                      onChange={(e) => setChoiceNumber(Number.parseInt(e.target.value) || 0)}
                      className="w-full border border-violet-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    />
                  </div>
                  <div className="text-center py-2 font-medium text-gray-700 col-span-1">0</div>
                  <div className="col-span-6">
                    <div className="flex items-center gap-3">
                      <select className="flex-1 border border-violet-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
                        <option value="">Select Line Type</option>
                        <option value="single">Single Blank Lines</option>
                        <option value="four">Four Blank Lines</option>
                        <option value="tabular">Tabular Boxes</option>
                        <option value="marks">Each Question Marks</option>
                      </select>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500/30" />
                        <span className="text-sm whitespace-nowrap">Chap Name</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Section */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={handleSearchQuestions}
                  className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white px-6 py-2 rounded-lg hover:from-violet-700 hover:to-indigo-600 transition-all duration-300 shadow-sm flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  )}
                  Search Questions
                </button>
                <span className="text-sm bg-white px-4 py-2 rounded-lg shadow-sm border border-violet-100">
                  Found <span className="font-medium text-violet-600">{searchedQuestions.length}</span> Question(s)
                </span>
              </div>

              {/* Questions Area */}
              <div className="mt-4 border border-violet-100 rounded-xl h-[400px] bg-gradient-to-br from-gray-50 to-white p-4 shadow-inner">
                <div className="h-full overflow-y-auto pr-2 space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                    </div>
                  ) : !hasSearched ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <svg
                        className="w-16 h-16 text-violet-200 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <p className="text-lg font-medium">No questions to display</p>
                      <p className="text-sm mt-2">Use the search button to find questions</p>
                    </div>
                  ) : searchedQuestions.length > 0 ? (
                    searchedQuestions.map((question) => (
                      <div
                        key={question.id}
                        onClick={() => isSelectionMode && handleQuestionToggle(question.id)}
                        className={`rounded-lg border p-4 transition-all duration-300 ${
                          selectedQuestionIds.has(question.id)
                            ? "bg-violet-100 border-violet-400 shadow-lg"
                            : "bg-white border-violet-100 hover:shadow-md"
                        } ${isSelectionMode ? "cursor-pointer" : ""}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedQuestionIds.has(question.id)}
                              onChange={() => handleQuestionToggle(question.id)}
                              className={`w-4 h-4 rounded text-violet-600 focus:ring-violet-500/30 ${
                                isSelectionMode ? "cursor-pointer" : "cursor-not-allowed"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs font-medium">
                                {question.type.toUpperCase()}
                              </span>
                              <span className="px-2 py-1 bg-violet-50 text-violet-600 rounded text-xs">
                                {question.chapter}
                              </span>
                              <span className="px-2 py-1 bg-violet-50 text-violet-600 rounded text-xs">
                                Marks: {question.marks}
                              </span>
                            </div>
                            <p className="text-gray-800 mb-2">{question.text}</p>
                            {question.type === "mcqs" && (
                              <div className="mt-1 ml-6">{determineOptionLayout(question.options)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No questions found. Try adjusting your filters.
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white px-6 py-2 rounded-full hover:from-violet-700 hover:to-indigo-600 transition-all duration-300 shadow-sm">
                    All
                  </button>
                  <button
                    onClick={() => setIsSelectionModeState(!isSelectionMode)}
                    className={`px-6 py-2 rounded-full transition-all duration-300 shadow-sm border ${
                      isSelectionMode
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-gray-700 border-violet-100 hover:bg-gray-50"
                    }`}
                  >
                    Selected
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRandomSelect}
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-6 py-2 rounded-lg hover:from-violet-700 hover:to-indigo-600 transition-all duration-300 shadow-sm"
                  >
                    RANDOM SELECT
                  </button>
                  <button
                    onClick={handleAddSelection}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-2 rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all duration-300 shadow-sm"
                  >
                    ADD SELECTION
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEditPanel && (
        <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl overflow-y-auto z-40">
          <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-indigo-500 text-white p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Paper Settings</h3>
            <button
              onClick={() => setShowEditPanel(false)}
              className="text-white/90 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-gray-700 font-medium">Header Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Header Layout</label>
                  <select
                    value={paperSettings.paperHeaderLayout}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, paperHeaderLayout: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  >
                    {layoutOptions.map((layout) => (
                      <option key={layout} value={layout}>
                        {layout}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Header Font Style</label>
                  <select
                    value={paperSettings.headerFontStyle}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, headerFontStyle: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  >
                    {headerFontStyles.map((font) => (
                      <option key={font.name} value={font.name}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Header Font Size</label>
                  <input
                    type="number"
                    value={paperSettings.headerFontSize}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, headerFontSize: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Header Font Color</label>
                  <select
                    value={paperSettings.headerFontColor}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, headerFontColor: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  >
                    <option value="Black">Black</option>
                    <option value="Gray">Gray</option>
                    <option value="Blue">Blue</option>
                    <option value="Green">Green</option>
                    <option value="Red">Red</option>
                    <option value="Purple">Purple</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-gray-700 font-medium">Logo & Header Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Logo Width</label>
                  <input
                    type="number"
                    value={paperSettings.logoWidth}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, logoWidth: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Logo Height</label>
                  <input
                    type="number"
                    value={paperSettings.logoHeight}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, logoHeight: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>

                {/* Logo Margin Controls */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Logo Margins</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Top</label>
                      <input
                        type="number"
                        value={paperSettings.logoMarginTop}
                        onChange={(e) => setPaperSettings((prev) => ({ ...prev, logoMarginTop: e.target.value }))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Right</label>
                      <input
                        type="number"
                        value={paperSettings.logoMarginRight}
                        onChange={(e) => setPaperSettings((prev) => ({ ...prev, logoMarginRight: e.target.value }))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Bottom</label>
                      <input
                        type="number"
                        value={paperSettings.logoMarginBottom}
                        onChange={(e) => setPaperSettings((prev) => ({ ...prev, logoMarginBottom: e.target.value }))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Left</label>
                      <input
                        type="number"
                        value={paperSettings.logoMarginLeft}
                        onChange={(e) => setPaperSettings((prev) => ({ ...prev, logoMarginLeft: e.target.value }))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Header Content Margin Controls */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Header Content Margins</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Top</label>
                      <input
                        type="number"
                        value={paperSettings.headerContentMarginTop}
                        onChange={(e) =>
                          setPaperSettings((prev) => ({ ...prev, headerContentMarginTop: e.target.value }))
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Right</label>
                      <input
                        type="number"
                        value={paperSettings.headerContentMarginRight}
                        onChange={(e) =>
                          setPaperSettings((prev) => ({ ...prev, headerContentMarginRight: e.target.value }))
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Bottom</label>
                      <input
                        type="number"
                        value={paperSettings.headerContentMarginBottom}
                        onChange={(e) =>
                          setPaperSettings((prev) => ({ ...prev, headerContentMarginBottom: e.target.value }))
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Left</label>
                      <input
                        type="number"
                        value={paperSettings.headerContentMarginLeft}
                        onChange={(e) =>
                          setPaperSettings((prev) => ({ ...prev, headerContentMarginLeft: e.target.value }))
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Header Position</label>
                  <select
                    value={paperSettings.headerPosition}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, headerPosition: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Header Vertical Alignment</label>
                  <select
                    value={paperSettings.headerVerticalAlign}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, headerVerticalAlign: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Add this section to the edit panel, right after the Header Settings section */}
            <div className="space-y-4">
              <h4 className="text-gray-700 font-medium">Heading Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Heading Font Style</label>
                  <select
                    value={paperSettings.headingFontStyle}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, headingFontStyle: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  >
                    {headerFontStyles.map((font) => (
                      <option key={font.name} value={font.name}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Heading Font Size</label>
                  <input
                    type="number"
                    value={paperSettings.headingFontSize}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, headingFontSize: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Heading Font Color</label>
                  <select
                    value={paperSettings.headingFontColor}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, headingFontColor: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  >
                    <option value="Black">Black</option>
                    <option value="Gray">Gray</option>
                    <option value="Blue">Blue</option>
                    <option value="Green">Green</option>
                    <option value="Red">Red</option>
                    <option value="Purple">Purple</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Text Settings */}
            <div className="space-y-4">
              <h4 className="text-gray-700 font-medium">Text Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Text Font Style</label>
                  <select
                    value={paperSettings.englishTextFontStyle}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, englishTextFontStyle: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  >
                    {headerFontStyles.map((font) => (
                      <option key={font.name} value={font.name}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Text Font Size</label>
                  <input
                    type="number"
                    value={paperSettings.textFontSize}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, textFontSize: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Text Font Color</label>
                  <select
                    value={paperSettings.textFontColor}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, textFontColor: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  >
                    <option value="Black">Black</option>
                    <option value="Gray">Gray</option>
                    <option value="Blue">Blue</option>
                    <option value="Green">Green</option>
                    <option value="Red">Red</option>
                    <option value="Purple">Purple</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Text Formatting</label>
                  <select
                    value={paperSettings.textFormatting}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, textFormatting: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Bold">Bold</option>
                    <option value="Italic">Italic</option>
                    <option value="Small Caps">Small Caps</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">MCQ Text Line Height</label>
                  <input
                    type="number"
                    step="0.1"
                    value={paperSettings.lineHeight}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, lineHeight: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  />
                  <p className="text-xs text-gray-500 mt-1">Affects MCQ question text</p>
                </div>

                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-1">Short Question Line Height</label>
                  <input
                    type="number"
                    step="0.1"
                    value={paperSettings.shortQuestionLineHeight}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, shortQuestionLineHeight: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  />
                  <p className="text-xs text-gray-500 mt-1">Affects short question text spacing</p>
                </div>

                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-1">Long Question Line Height</label>
                  <input
                    type="number"
                    step="0.1"
                    value={paperSettings.longQuestionLineHeight}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, longQuestionLineHeight: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                  />
                  <p className="text-xs text-gray-500 mt-1">Affects long question text spacing</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-gray-700 font-medium">Paper Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Class</label>
                  <input
                    type="text"
                    value={paperSettings.class}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, class: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                    placeholder="9th"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Subject</label>
                  <input
                    type="text"
                    value={paperSettings.subject}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, subject: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                    placeholder="Biology"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Maximum Marks</label>
                  <input
                    type="text"
                    value={paperSettings.maximumMarks}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, maximumMarks: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                    placeholder="Enter maximum marks"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Student Name</label>
                  <input
                    type="text"
                    value={paperSettings.studentName}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, studentName: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                    placeholder="Enter student name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Section</label>
                  <input
                    type="text"
                    value={paperSettings.section}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, section: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                    placeholder="Enter section"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Roll No.</label>
                  <input
                    type="text"
                    value={paperSettings.rollNo}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, rollNo: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                    placeholder="Enter roll number"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Time</label>
                  <input
                    type="text"
                    value={paperSettings.time}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, time: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                    placeholder="Enter time"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Paper Type</label>
                  <input
                    type="text"
                    value={paperSettings.paperType}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, paperType: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                    placeholder="Enter paper type"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Obtained Marks</label>
                  <input
                    type="text"
                    value={paperSettings.obtainedMarks}
                    onChange={(e) => setPaperSettings((prev) => ({ ...prev, obtainedMarks: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-violet-500/30"
                    placeholder="Enter obtained marks"
                  />
                </div>
              </div>
            </div>
            {/* 4. Update the save settings button to use the notification system */}
            <button
              onClick={() => {
                localStorage.setItem("paperDefaultSettings", JSON.stringify(paperSettings))
                setNotification({
                  show: true,
                  message: "Settings saved successfully!",
                  type: "success",
                })
                setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 3000)
              }}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white py-2 rounded-lg hover:from-violet-700 hover:to-indigo-600 transition-all duration-300"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
      {/* Paper Content - Updated with enhanced header layouts */}
      <div className="max-w-screen-2xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 print-content paper-container">
          <div className={`${getHeaderLayoutClass(paperSettings.paperHeaderLayout)}`}>
            {/* Layout 1: Traditional stacked layout */}

            {paperSettings.paperHeaderLayout === "Layout 1" && (
              <>
                <div className={`flex ${getHeaderPositionClasses()} p-6 border-b border-gray-200`}>
                  <div className="flex items-center">
                    <DynamicImage
                      src="/logo.png"
                      alt="School Logo"
                      width={Number(paperSettings.logoWidth)}
                      height={Number(paperSettings.logoHeight)}
                      className="mr-4"
                      style={{
                        marginTop: `${paperSettings.logoMarginTop}px`,
                        marginRight: `${paperSettings.logoMarginRight}px`,
                        marginBottom: `${paperSettings.logoMarginBottom}px`,
                        marginLeft: `${paperSettings.logoMarginLeft}px`,
                      }}
                    />
                    <div
                      className="flex-1"
                      style={{
                        marginTop: `${paperSettings.headerContentMarginTop}px`,
                        marginRight: `${paperSettings.headerContentMarginRight}px`,
                        marginBottom: `${paperSettings.headerContentMarginBottom}px`,
                        marginLeft: `${paperSettings.headerContentMarginLeft}px`,
                      }}
                    >
                      <h1 className="font-bold mb-2" style={headerTextStyle}>
                        LEAP EVENING COACHING
                      </h1>
                      <p className="text-sm">155/A-Block, Arabia Islamia Road, Burewala.</p>
                      <p className="text-sm">District Vehari, Punjab, Pakistan • Ph: 0301-6509222</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 pl-16" style={getTextStyle()}>
                  <table className="w-full border-collapse bg-white">
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 p-2 w-1/3 bg-gray-50">
                          <span className="font-semibold text-gray-800 text-base">Class: </span>
                          <span className="text-gray-700 text-base">{paperSettings.class || "9th"}</span>
                        </td>
                        <td className="border border-gray-200 p-2 w-1/3 bg-gray-50">
                          <span className="font-semibold text-gray-800 text-base">Subject: </span>
                          <span className="text-gray-700 text-base">{paperSettings.subject || "Biology"}</span>
                        </td>
                        <td className="border border-gray-200 p-2 w-1/3 bg-gray-50">
                          <span className="font-semibold text-gray-800 text-base">Maximum Marks: </span>
                          <span className="text-gray-700 text-base">{paperSettings.maximumMarks || "_______"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 p-4">
                          <span className="font-semibold text-gray-800 text-lg">Student Name: </span>
                          <span className="text-gray-700 text-lg">{paperSettings.studentName || "_______"}</span>
                        </td>
                        <td className="border border-gray-200 p-4">
                          <span className="font-semibold text-gray-800 text-lg">Section: </span>
                          <span className="text-gray-700 text-lg">{paperSettings.section || "_______"}</span>
                        </td>
                        <td className="border border-gray-200 p-4">
                          <span className="font-semibold text-gray-800 text-lg">Roll No.: </span>
                          <span className="text-gray-700 text-lg">{paperSettings.rollNo || "_______"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 p-4 bg-gray-50">
                          <span className="font-semibold text-gray-800 text-lg">Time: </span>
                          <span className="text-gray-700 text-lg">{paperSettings.time || "_______"}</span>
                        </td>
                        <td className="border border-gray-200 p-4 bg-gray-50">
                          <span className="font-semibold text-gray-800 text-lg">Paper Type: </span>
                          <span className="text-gray-700 text-lg">{paperSettings.paperType || "_______"}</span>
                        </td>
                        <td className="border border-gray-200 p-4 bg-gray-50">
                          <span className="font-semibold text-gray-800 text-lg">Obtained Marks: </span>
                          <span className="text-gray-700 text-lg">{paperSettings.obtainedMarks || "_______"}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {/* Additional layouts omitted for brevity */}
          </div>
        </div>
      </div>
      <div className="mt-8 pl-16" style={getTextStyle()}>
        <div className="mt-8 px-8">
          {Object.entries(groupQuestionsByType(selectedQuestions)).map(([type, questions], sectionIndex) => {
            if (questions.length === 0) return null

            const marksPerQuestion = getMarksPerQuestion(type)

            // Calculate the number to use for marks calculation
            let marksNumber = questions.length
            if (choiceNumber > 0) {
              if (type === "short" || type === "long") {
                marksNumber = Math.max(1, questions.length - choiceNumber)
              } else {
                marksNumber = choiceNumber
              }
            }

            return (
              <div key={type} className="mb-10 question-section">
                <div className="flex justify-between items-center mb-4">
                  <div className="font-semibold text-gray-800" style={getTextStyle("heading")}>
                    {`${(sectionIndex + 1).toString().padStart(2, "0")}. ${getHeadingTextByType(type)}`}
                  </div>
                  {/* Update the marks calculation display */}
                  <div className="text-gray-700 font-medium">
                    ({marksNumber} × {marksPerQuestion}) = {marksNumber * marksPerQuestion}
                  </div>
                </div>

                {questions.map((question, index) => {
                  // Check if the question text already starts with a number
                  const hasLeadingNumber = startsWithNumber(question.text)
                  const displayText = hasLeadingNumber ? question.text : question.text

                  return (
                    <div
                      key={question.id}
                      style={{ marginBottom: type === "mcqs" ? "24px" : type === "long" ? "0px" : "2px" }}
                    >
                      <div className="flex items-start">
                        {type === "mcqs" ? (
                          <div className="flex-1">
                            <div className="flex items-start">
                              {!hasLeadingNumber && (
                                <span className="inline-block w-4 text-right mr-1">{index + 1}.</span>
                              )}
                              <p className="text-gray-800" style={getQuestionTextStyle(type)}>
                                {displayText}
                              </p>
                            </div>
                            <div className="mt-1 ml-6">{determineOptionLayout(question.options)}</div>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <div
                              className="flex items-start"
                              style={{
                                lineHeight:
                                  type === "short"
                                    ? paperSettings.shortQuestionLineHeight
                                    : paperSettings.longQuestionLineHeight,
                              }}
                            >
                              {!hasLeadingNumber && (
                                <span className="inline-block w-4 text-right mr-1" style={{ lineHeight: "inherit" }}>
                                  {index + 1}.
                                </span>
                              )}
                              <div>
                                <p className="text-gray-800" style={getQuestionTextStyle(type)}>
                                  {displayText}
                                </p>
                                <div className={`mt-0.5 ${type === "short" ? "h-6" : "h-8"}`}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

