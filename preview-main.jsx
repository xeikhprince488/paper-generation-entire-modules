"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
// Remove this import as we'll fetch from the database instead
// import { ninthBiology } from "@/data/dummyQuestions"

// Use dynamic import for Image component to prevent hydration mismatch
// Update the DynamicImage component configuration
const DynamicImage = dynamic(() => import("next/image"), {
  ssr: true, // Change to true for better SSR support
  loading: () => (
    <div className="animate-pulse bg-gray-200 rounded-lg" style={{ width: "150px", height: "150px" }}></div>
  ),
})

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
  // Add a new state for choice number right after the medium state
  const [medium, setMedium] = useState("")
  const [choiceNumber, setChoiceNumber] = useState(0)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set())
  // Add new state for filtering criteria right after the selectedQuestionIds state
  const [criteria, setCriteria] = useState({
    difficulty: "",
    questionFormat: "",
    conceptual: false,
    numerical: false,
    diagram: false,
  })
  // First, add these to the paperSettings state
  const [paperSettings, setPaperSettings] = useState({
    paperHeaderLayout: "Layout 1",
    headerFontStyle: "Default",
    headerFontSize: "18",
    headerFontColor: "Black", // Add this line
    headingFontStyle: "Default",
    headingFontSize: "16",
    headingFontColor: "Black",
    textFontSize: "12",
    paperFontColor: "Black",
    textFontColor: "Black", // Add this line
    englishTextFontStyle: "Default",
    urduTextFontStyle: "Default",
    lineHeight: "1.5",
    shortQuestionLineHeight: "1.2", // Add this line for short questions
    longQuestionLineHeight: "1.2", // Add this line for long questions
    textFormatting: "Normal",
    watermark: "No Watermark",
    pinWatermarkOpacity: "0.1",
    logoHeight: "150",
    logoWidth: "150",
    headerPosition: "left", // Options: left, center, right
    headerVerticalAlign: "top", // Options: top, middle, bottom
    headerMargin: "8", // Margin around the header
    // Add these new margin settings
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
    // Paper details fields
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
  const [setRandomSelectedQuestions, setRandomSelectedQuestionsState] = useState([])
  const [isSelectionMode, setIsSelectionModeState] = useState([])
  // 1. First, add a state for toast/notification messages
  const [notification, setNotification] = useState({ show: false, message: "", type: "info" })
  // First, add a new state for tracking the save operation:
  const [isSaving, setIsSaving] = useState(false)

  // Add state for storing fetched questions
  const [allQuestions, setAllQuestions] = useState([])

  // Add this new function after your existing state declarations
  // Modify the filterQuestions function to be less restrictive and debug the filtering process
  const filterQuestions = () => {
    if (!allQuestions.length) {
      console.log("No questions available to filter")
      return []
    }

    console.log("Filtering questions. Total questions:", allQuestions.length)
    console.log("Current criteria:", criteria)
    console.log("Selected exercises:", selectedExercises)

    const filtered = allQuestions.filter((question) => {
      // Check if the question has all required properties
      if (!question) {
        console.log("Found undefined question")
        return false
      }

      // More lenient matching - if criteria is not set, don't filter on it
      const matchesDifficulty = !criteria.difficulty || question.difficulty === criteria.difficulty
      const matchesFormat = !criteria.questionFormat || question.format === criteria.questionFormat

      // Handle boolean values that might be strings "true"/"false" or actual booleans
      const matchesConceptual =
        !criteria.conceptual ||
        question.is_conceptual === true ||
        question.is_conceptual === "true" ||
        (question.tags && question.tags.includes("conceptual"))

      const matchesNumerical =
        !criteria.numerical ||
        question.is_numerical === true ||
        question.is_numerical === "true" ||
        (question.tags && question.tags.includes("numerical"))

      const matchesDiagram =
        !criteria.diagram ||
        question.has_diagram === true ||
        question.has_diagram === "true" ||
        (question.tags && question.tags.includes("diagram"))

      // Check if question belongs to selected exercises/topics
      const matchesExercises =
        !selectedExercises.length ||
        (question.topic && selectedExercises.includes(question.topic)) ||
        (question.exercise && selectedExercises.includes(question.exercise))

      // Also filter by question type if set
      const matchesType = !questionType || question.type === questionType.toLowerCase()

      // Also filter by source if set
      const matchesSource = !selectionSource || question.source === selectionSource

      // Also filter by medium if set
      const matchesMedium = !medium || question.medium === medium

      const result =
        matchesDifficulty &&
        matchesFormat &&
        matchesConceptual &&
        matchesNumerical &&
        matchesDiagram &&
        matchesExercises &&
        matchesType &&
        matchesSource &&
        matchesMedium

      return result
    })

    console.log("Filtered questions count:", filtered.length)
    return filtered
  }

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

  // Add this function to the component to ensure proper page setup for printing
  // Add this right after your existing useEffect hooks

  useEffect(() => {
    // Add a listener for the beforeprint event to prepare the document
    const handleBeforePrint = () => {
      // Add any additional print preparation here
      document.body.classList.add("print-mode")

      // Force recalculation of layout
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

  // Add this useEffect after your other useEffect hooks
  useEffect(() => {
    if (selectedQuestions.length > 0) {
      const totalMarks = calculatePaperTotalMarks()
      setPaperSettings((prev) => ({
        ...prev,
        maximumMarks: totalMarks.toString(),
      }))
    }
  }, [selectedQuestions, choiceNumber])

  // Add useEffect to fetch questions when the component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Get selected exercises from localStorage
        const savedExercises = localStorage.getItem("selectedBiologyExercises")
        let selectedTopics = []

        if (savedExercises) {
          try {
            selectedTopics = JSON.parse(savedExercises)
            console.log("Selected topics:", selectedTopics)
          } catch (error) {
            console.error("Error parsing selected exercises:", error)
          }
        }

        const params = new URLSearchParams({
          class: "9th",
          subject: "Biology",
          limit: "10000", // Try an extremely high number
          no_limit: "true", // Add a custom parameter
          all_records: "true", // Add another custom parameter
        })

        // If there are selected topics, add them to the query
        if (selectedTopics && selectedTopics.length > 0) {
          // Join all topics with commas for the API
          params.append("topic", selectedTopics.join(","))
        }

        // Update the API endpoint to match the one used in handleSearchQuestions
        const apiUrl = "https://edu.largifysolutions.com/api-questions.php"

        // Also add a debug log right after the fetch:
        console.log("API URL being called:", `${apiUrl}?${params}`)

        const response = await fetch(`${apiUrl}?${params}`)

        if (!response.ok) {
          // Check the content type to provide better error messages
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            throw new Error(errorData.message || "Failed to fetch questions")
          } else {
            throw new Error(`API returned ${response.status}: ${response.statusText}`)
          }
        }

        const data = await response.json()
        console.log("Total questions fetched:", data.length) // Add this to debug
        setAllQuestions(data)
      } catch (error) {
        console.error("Error fetching questions:", error)
        setNotification({
          show: true,
          message: `Failed to fetch questions: ${error.message}`,
          type: "error",
        })
        setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 5000)
        // Initialize with empty array to prevent further errors
        setAllQuestions([])
      }
    }

    fetchQuestions()
  }, [])

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
          // Remove lineHeight from header style
        }
      case "heading":
        return {
          fontFamily: paperSettings.headingFontStyle,
          fontSize: `${paperSettings.headingFontSize}px`,
          color: paperSettings.headingFontColor || paperSettings.paperFontColor,
          // Remove lineHeight from heading style
          fontWeight: "bold",
        }
      default:
        return {
          fontFamily:
            paperSettings.englishTextFontStyle === "Default" ? "system-ui" : paperSettings.englishTextFontStyle,
          fontSize: `${paperSettings.textFontSize}px`,
          color: paperSettings.textFontColor || paperSettings.paperFontColor,
          lineHeight: paperSettings.lineHeight, // Keep lineHeight only for normal text (questions)
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

  // Update the search handler
  // Update the handleSearch function to provide better debugging and error handling
  const handleSearch = () => {
    setLoading(true)
    try {
      console.log("Starting search with criteria:", criteria)
      console.log("Question type:", questionType)
      console.log("Selection source:", selectionSource)
      console.log("Medium:", medium)

      // If we have no questions yet, try to fetch them first
      if (allQuestions.length === 0) {
        console.log("No questions in state, fetching from API first")
        handleSearchQuestions()
        return
      }

      const filteredQuestions = filterQuestions()
      console.log(`Found ${filteredQuestions.length} questions after filtering`)
      setSearchedQuestions(filteredQuestions)

      if (filteredQuestions.length === 0) {
        setNotification({
          show: true,
          message: "No questions match your criteria. Try adjusting your filters.",
          type: "warning",
        })
        setTimeout(() => setNotification({ show: false, message: "", type: "info" }), 5000)
      } else if (filteredQuestions.length === 1) {
        console.log("Only one question found:", filteredQuestions[0])
      }
    } catch (error) {
      console.error("Error filtering questions:", error)
      setNotification({
        show: true,
        message: "Error filtering questions. Please try again.",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update the handleSearchQuestions function to reset the choice number when searching
  // Update the handleSearchQuestions function to ensure it properly fetches and processes questions
  const handleSearchQuestions = () => {
    setLoading(true)
    console.log("Starting API search for questions")

    // Build query parameters
    const params = new URLSearchParams({
      class: paperSettings.class,
      subject: paperSettings.subject,
      limit: "10000",
      no_limit: "true",
      all_records: "true",
    })

    // Add optional filters
    if (selectedExercises && selectedExercises.length > 0) {
      // Join all topics with commas for the API
      params.append("topic", selectedExercises.join(","))
      console.log("Filtering by topics:", selectedExercises.join(","))
    }

    if (questionType) {
      params.append("type", questionType.toLowerCase())
      console.log("Filtering by type:", questionType.toLowerCase())
    }

    if (selectionSource) {
      params.append("source", selectionSource)
      console.log("Filtering by source:", selectionSource)
    }

    if (medium) {
      params.append("medium", medium)
      console.log("Filtering by medium:", medium)
    }

    // Add criteria filters to API params
    if (criteria.difficulty) {
      params.append("difficulty", criteria.difficulty)
      console.log("Filtering by difficulty:", criteria.difficulty)
    }

    if (criteria.questionFormat) {
      params.append("format", criteria.questionFormat)
      console.log("Filtering by format:", criteria.questionFormat)
    }

    if (criteria.conceptual) {
      params.append("is_conceptual", "true")
      console.log("Filtering by conceptual: true")
    }

    if (criteria.numerical) {
      params.append("is_numerical", "true")
      console.log("Filtering by numerical: true")
    }

    if (criteria.diagram) {
      params.append("has_diagram", "true")
      console.log("Filtering by diagram: true")
    }

    // Fetch questions from the API
    const apiUrl = "https://edu.largifysolutions.com/api-questions.php"
    console.log("API URL being called:", `${apiUrl}?${params}`)

    fetch(`${apiUrl}?${params}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("API returned questions:", data.length)

        if (data.length === 0) {
          setNotification({
            show: true,
            message: "No questions found. Try adjusting your search criteria.",
            type: "warning",
          })
        } else if (data.length === 1) {
          console.log("Only one question returned from API:", data[0])
        }

        // Store all questions for future filtering
        setAllQuestions(data)
        setSearchedQuestions(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching questions:", error)
        setNotification({
          show: true,
          message: `Failed to fetch questions: ${error.message}`,
          type: "error",
        })
        setSearchedQuestions([])
        setLoading(false)
      })
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

      // Create a JSON payload that matches the actual database structure
      const paperData = {
        class: paperSettings.class || "9th",
        subject: paperSettings.subject || "Biology",
        // Store everything in the content field as JSON
        content: JSON.stringify({
          html: paperContainer.outerHTML + questionsContent.outerHTML,
          paperSettings: paperSettings,
          questions: selectedQuestions,
        }),
        status: "SAVED",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("Paper data prepared as JSON")

      // Make the API request with JSON format
      const response = await fetch("https://edu.largifysolutions.com/api-papers.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paperData),
      })

      console.log("API response status:", response.status)

      // Try to get the response text to see what the error might be
      const responseText = await response.text()
      console.log("API response text:", responseText)

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}. ${responseText || ""}`)
      }

      // Try to parse the response as JSON if possible
      let result
      try {
        result = JSON.parse(responseText)
        console.log("API response data:", result)
      } catch (e) {
        console.log("Response is not JSON:", responseText)
        result = { message: responseText }
      }

      setNotification({
        show: true,
        message: "Paper saved successfully!",
        type: "success",
      })
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
                {/* <Image
                  src="/book-cover.png"
                  alt="Biology Book"
                  width={45}
                  height={55}
                  className="object-contain hover:scale-105 transition-transform duration-300"
                /> */}
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
                  {/* Choice input in the second row of the control panel */}
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
                  <div className="col-span-7">
                    <div className="flex items-center gap-3">
                      <select className="flex-1 border border-violet-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
                        <option value="">Select Line Type</option>
                        <option value="single">Single Blank Lines</option>
                        <option value="four">Four Blank Lines</option>
                        <option value="tabular">Tabular Boxes</option>
                        <option value="marks">Each Question Marks</option>
                      </select>
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
                  Selected <span className="font-medium text-violet-600">{searchedQuestions.length}</span> Question(s)
                </span>
              </div>

              {/* Questions Area */}
              <div className="mt-4 border border-violet-100 rounded-xl h-[400px] bg-gradient-to-br from-gray-50 to-white p-4 shadow-inner">
                <div className="h-full overflow-y-auto pr-2 space-y-4">
                  {(isSelectionMode ? searchedQuestions : searchedQuestions).map((question) => (
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
                  ))}
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
            {/* Layout 2: Centered header with details below */}
            {paperSettings.paperHeaderLayout === "Layout 2" && (
              <>
                <div className="flex flex-col items-center text-center p-6 border-b border-gray-200">
                  <DynamicImage
                    src="/logo.png"
                    alt="School Logo"
                    width={paperSettings.logoWidth}
                    height={paperSettings.logoHeight}
                    className="mb-4"
                  />
                  <div>
                    <h1 className="font-bold mb-1" style={headerTextStyle}>
                      LEAP EVENING COACHING
                    </h1>
                    <p className="text-sm">Excellence in Education Since 1995</p>
                    <p className="text-sm mt-2">155/A-Block, Arabia Islamia Road, Burewala.</p>
                  </div>
                </div>
                <div className="p-6" style={getTextStyle()}>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800 mb-1">Class</p>
                      <p className="text-gray-700">{paperSettings.class || "9th"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800 mb-1">Subject</p>
                      <p className="text-gray-700">{paperSettings.subject || "Biology"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800 mb-1">Maximum Marks</p>
                      <p className="text-gray-700">{paperSettings.maximumMarks || "_______"}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800 mb-1">Student Name</p>
                      <p className="text-gray-700">{paperSettings.studentName || "_______"}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800 mb-1">Section</p>
                      <p className="text-gray-700">{paperSettings.section || "_______"}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800 mb-1">Roll No.</p>
                      <p className="text-gray-700">{paperSettings.rollNo || "_______"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800 mb-1">Time</p>
                      <p className="text-gray-700">{paperSettings.time || "_______"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800 mb-1">Paper Type</p>
                      <p className="text-gray-700">{paperSettings.paperType || "_______"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800 mb-1">Obtained Marks</p>
                      <p className="text-gray-700">{paperSettings.obtainedMarks || "_______"}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Layout 3: Banner style with details in two columns */}
            {paperSettings.paperHeaderLayout === "Layout 3" && (
              <>
                <div className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white p-6">
                  <div className="flex items-center justify-between">
                    <DynamicImage
                      src="/logo.png"
                      alt="School Logo"
                      width={paperSettings.logoWidth}
                      height={paperSettings.logoHeight}
                    />
                    <div className="text-center">
                      <h1 className="font-bold mb-1" style={headerTextStyle}>
                        LEAP EVENING COACHING
                      </h1>
                      <p className="text-sm">Empowering Futures Through Education</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">Date: ___________</p>
                      <p className="text-sm mt-2">Ref: SCB/2023/___</p>
                    </div>
                  </div>
                </div>
                <div className="p-6" style={getTextStyle()}>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-800">Class:</span>
                        <span className="text-gray-700">{paperSettings.class || "9th"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-800">Subject:</span>
                        <span className="text-gray-700">{paperSettings.subject || "Biology"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-800">Maximum Marks:</span>
                        <span className="text-gray-700">{paperSettings.maximumMarks || "_______"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-800">Time:</span>
                        <span className="text-gray-700">{paperSettings.time || "_______"}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-800">Student Name:</span>
                        <span className="text-gray-700">{paperSettings.studentName || "_______"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-800">Section:</span>
                        <span className="text-gray-700">{paperSettings.section || "_______"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-800">Roll No.:</span>
                        <span className="text-gray-700">{paperSettings.rollNo || "_______"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-800">Paper Type:</span>
                        <span className="text-gray-700">{paperSettings.paperType || "_______"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Layout 4: Gradient background with centered logo and details in cards */}
            {paperSettings.paperHeaderLayout === "Layout 4" && (
              <>
                <div className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <DynamicImage
                      src="/logo.png"
                      alt="School Logo"
                      width={paperSettings.logoWidth}
                      height={paperSettings.logoHeight}
                    />
                  </div>
                  <h1 className="font-bold mb-1 text-violet-800" style={headerTextStyle}>
                    LEAP EVENING COACHING
                  </h1>
                  <p className="text-sm text-violet-600">P.E.C.H.S Block Civil Line, Satellite Town</p>
                </div>
                <div className="px-6 pb-6" style={getTextStyle()}>
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <div className="bg-violet-50 p-3 rounded-t-lg">
                          <p className="font-semibold text-violet-800">Class</p>
                        </div>
                        <div className="border border-violet-100 p-3 rounded-b-lg">
                          <p className="text-gray-700">{paperSettings.class || "9th"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="bg-violet-50 p-3 rounded-t-lg">
                          <p className="font-semibold text-violet-800">Subject</p>
                        </div>
                        <div className="border border-violet-100 p-3 rounded-b-lg">
                          <p className="text-gray-700">{paperSettings.subject || "Biology"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="bg-violet-50 p-3 rounded-t-lg">
                          <p className="font-semibold text-violet-800">Maximum Marks</p>
                        </div>
                        <div className="border border-violet-100 p-3 rounded-b-lg">
                          <p className="text-gray-700">{paperSettings.maximumMarks || "_______"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="bg-violet-50 p-3 rounded-t-lg">
                          <p className="font-semibold text-violet-800">Student Name</p>
                        </div>
                        <div className="border border-violet-100 p-3 rounded-b-lg">
                          <p className="text-gray-700">{paperSettings.studentName || "_______"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="bg-violet-50 p-3 rounded-t-lg">
                          <p className="font-semibold text-violet-800">Section</p>
                        </div>
                        <div className="border border-violet-100 p-3 rounded-b-lg">
                          <p className="text-gray-700">{paperSettings.section || "_______"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="bg-violet-50 p-3 rounded-t-lg">
                          <p className="font-semibold text-violet-800">Roll No.</p>
                        </div>
                        <div className="border border-violet-100 p-3 rounded-b-lg">
                          <p className="text-gray-700">{paperSettings.rollNo || "_______"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="bg-violet-50 p-3 rounded-t-lg">
                          <p className="font-semibold text-violet-800">Time</p>
                        </div>
                        <div className="border border-violet-100 p-3 rounded-b-lg">
                          <p className="text-gray-700">{paperSettings.time || "_______"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="bg-violet-50 p-3 rounded-t-lg">
                          <p className="font-semibold text-violet-800">Paper Type</p>
                        </div>
                        <div className="border border-violet-100 p-3 rounded-b-lg">
                          <p className="text-gray-700">{paperSettings.paperType || "_______"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="bg-violet-50 p-3 rounded-t-lg">
                          <p className="font-semibold text-violet-800">Obtained Marks</p>
                        </div>
                        <div className="border border-violet-100 p-3 rounded-b-lg">
                          <p className="text-gray-700">{paperSettings.obtainedMarks || "_______"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Layout 5: Rounded corners with logo in center and details in horizontal layout */}
            {paperSettings.paperHeaderLayout === "Layout 5" && (
              <>
                <div className="bg-violet-100 p-6 text-center">
                  <DynamicImage
                    src="/logo.png"
                    alt="School Logo"
                    width={paperSettings.logoWidth}
                    height={paperSettings.logoHeight}
                    className="mx-auto mb-3"
                  />
                  <h1 className="font-bold mb-2 text-violet-800" style={headerTextStyle}>
                    LEAP EVENING COACHING
                  </h1>
                  <div className="bg-white px-8 py-2 rounded-full shadow-md inline-block">
                    <p className="text-sm text-violet-700 font-medium">Examination Department</p>
                  </div>
                </div>
                <div className="p-6" style={getTextStyle()}>
                  <div className="flex flex-wrap -mx-2">
                    <div className="w-1/3 px-2 mb-4">
                      <div className="border border-violet-200 rounded-lg overflow-hidden">
                        <div className="bg-violet-50 p-2 text-center">
                          <p className="font-semibold text-violet-800">Class</p>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-gray-700">{paperSettings.class || "9th"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-1/3 px-2 mb-4">
                      <div className="border border-violet-200 rounded-lg overflow-hidden">
                        <div className="bg-violet-50 p-2 text-center">
                          <p className="font-semibold text-violet-800">Subject</p>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-gray-700">{paperSettings.subject || "Biology"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-1/3 px-2 mb-4">
                      <div className="border border-violet-200 rounded-lg overflow-hidden">
                        <div className="bg-violet-50 p-2 text-center">
                          <p className="font-semibold text-violet-800">Maximum Marks</p>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-gray-700">{paperSettings.maximumMarks || "_______"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-1/3 px-2 mb-4">
                      <div className="border border-violet-200 rounded-lg overflow-hidden">
                        <div className="bg-violet-50 p-2 text-center">
                          <p className="font-semibold text-violet-800">Student Name</p>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-gray-700">{paperSettings.studentName || "_______"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-1/3 px-2 mb-4">
                      <div className="border border-violet-200 rounded-lg overflow-hidden">
                        <div className="bg-violet-50 p-2 text-center">
                          <p className="font-semibold text-violet-800">Section</p>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-gray-700">{paperSettings.section || "_______"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-1/3 px-2 mb-4">
                      <div className="border border-violet-200 rounded-lg overflow-hidden">
                        <div className="bg-violet-50 p-2 text-center">
                          <p className="font-semibold text-violet-800">Roll No.</p>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-gray-700">{paperSettings.rollNo || "_______"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-1/3 px-2 mb-4">
                      <div className="border border-violet-200 rounded-lg overflow-hidden">
                        <div className="bg-violet-50 p-2 text-center">
                          <p className="font-semibold text-violet-800">Time</p>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-gray-700">{paperSettings.time || "_______"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-1/3 px-2 mb-4">
                      <div className="border border-violet-200 rounded-lg overflow-hidden">
                        <div className="bg-violet-50 p-2 text-center">
                          <p className="font-semibold text-violet-800">Paper Type</p>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-gray-700">{paperSettings.paperType || "_______"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-1/3 px-2 mb-4">
                      <div className="border border-violet-200 rounded-lg overflow-hidden">
                        <div className="bg-violet-50 p-2 text-center">
                          <p className="font-semibold text-violet-800">Obtained Marks</p>
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-gray-700">{paperSettings.obtainedMarks || "_______"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Layout 6: Bordered box with logo on right and details in a clean table */}
            {paperSettings.paperHeaderLayout === "Layout 6" && (
              <>
                <div className="p-6 border-b border-violet-200">
                  <div className="flex flex-row-reverse items-center justify-start">
                    <DynamicImage
                      src="/logo.png"
                      alt="School Logo"
                      width={paperSettings.logoWidth}
                      height={paperSettings.logoHeight}
                      className="ml-8"
                    />
                    <div className="flex-1">
                      <h1 className="font-bold mb-2" style={headerTextStyle}>
                        LEAP EVENING COACHING
                      </h1>
                      <p className="text-sm">155/A-Block, Arabia Islamia Road, Burewala.</p>
                      <p className="text-sm">District Vehari, Punjab, Pakistan • Ph: 0301-6509222</p>
                    </div>
                  </div>
                </div>
                <div className="p-6" style={getTextStyle()}>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="border-b border-violet-100 py-3 px-4 w-1/3">
                          <span className="font-semibold text-violet-800">Class:</span>
                        </td>
                        <td className="border-b border-violet-100 py-3 px-4 w-2/3">
                          <span className="text-gray-700">{paperSettings.class || "9th"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="font-semibold text-violet-800">Subject:</span>
                        </td>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="text-gray-700">{paperSettings.subject || "Biology"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="font-semibold text-violet-800">Maximum Marks:</span>
                        </td>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="text-gray-700">{paperSettings.maximumMarks || "_______"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="font-semibold text-violet-800">Student Name:</span>
                        </td>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="text-gray-700">{paperSettings.studentName || "_______"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="font-semibold text-violet-800">Section:</span>
                        </td>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="text-gray-700">{paperSettings.section || "_______"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="font-semibold text-violet-800">Roll No.:</span>
                        </td>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="text-gray-700">{paperSettings.rollNo || "_______"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="font-semibold text-violet-800">Time:</span>
                        </td>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="text-gray-700">{paperSettings.time || "_______"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="font-semibold text-violet-800">Paper Type:</span>
                        </td>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="text-gray-700">{paperSettings.paperType || "_______"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="font-semibold text-violet-800">Obtained Marks:</span>
                        </td>
                        <td className="border-b border-violet-100 py-3 px-4">
                          <span className="text-gray-700">{paperSettings.obtainedMarks || "_______"}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {/* Layout 7: Shadow box with two-column header and details in a modern layout */}
            {paperSettings.paperHeaderLayout === "Layout 7" && (
              <>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <DynamicImage
                      src="/logo.png"
                      alt="School Logo"
                      width={paperSettings.logoWidth}
                      height={paperSettings.logoHeight}
                      className="mr-4"
                    />
                    <div className="flex-1 max-w-5xl mx-auto pl-8">
                      <h1 className="text-center font-bold mb-3" style={headerTextStyle}>
                        LEAP EVENING COACHING
                      </h1>
                      <p className="text-center text-sm">
                        P.E.C.H.S Block Civil Line Satellite Town Burewala District Vehari Punjab Pakistan
                        Ph:0301-6509222
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6" style={getTextStyle()}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Class:</span>
                          <span className="text-gray-700">{paperSettings.class || "9th"}</span>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Student Name:</span>
                          <span className="text-gray-700">{paperSettings.studentName || "_______"}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Time:</span>
                          <span className="text-gray-700">{paperSettings.time || "_______"}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Subject:</span>
                          <span className="text-gray-700">{paperSettings.subject || "Biology"}</span>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Section:</span>
                          <span className="text-gray-700">{paperSettings.section || "_______"}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Roll No.:</span>
                          <span className="text-gray-700">{paperSettings.rollNo || "_______"}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Paper Type:</span>
                          <span className="text-gray-700">{paperSettings.paperType || "_______"}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Obtained Marks:</span>
                          <span className="text-gray-700">{paperSettings.obtainedMarks || "_______"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Layout 8: Colored background with logo and title side by side and details in a clean layout */}
            {paperSettings.paperHeaderLayout === "Layout 8" && (
              <>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-center mb-3">
                    <DynamicImage
                      src="/logo.png"
                      alt="School Logo"
                      width={paperSettings.logoWidth}
                      height={paperSettings.logoHeight}
                      className="mr-4"
                    />
                    <h1 className="font-bold" style={headerTextStyle}>
                      LEAP EVENING COACHING
                    </h1>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm text-center">
                    <p className="text-sm font-medium">Term Examination 2023-24</p>
                  </div>
                </div>
                <div className="p-6" style={getTextStyle()}>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Examination Details</h3>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="mb-3 pb-3 border-b border-gray-100">
                            <p className="text-sm text-gray-500">Class</p>
                            <p className="font-medium">{paperSettings.class || "9th"}</p>
                          </div>
                          <div className="mb-3 pb-3 border-b border-gray-100">
                            <p className="text-sm text-gray-500">Subject</p>
                            <p className="font-medium">{paperSettings.subject || "Biology"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Maximum Marks</p>
                            <p className="font-medium">{paperSettings.maximumMarks || "_______"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Student Information</h3>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="mb-3 pb-3 border-b border-gray-100">
                            <p className="text-sm text-gray-500">Student Name</p>
                            <p className="font-medium">{paperSettings.studentName || "_______"}</p>
                          </div>
                          <div className="mb-3 pb-3 border-b border-gray-100">
                            <p className="text-sm text-gray-500">Section</p>
                            <p className="font-medium">{paperSettings.section || "_______"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Roll No.</p>
                            <p className="font-medium">{paperSettings.rollNo || "_______"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Paper Information</h3>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="mb-3 pb-3 border-b border-gray-100">
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="font-medium">{paperSettings.time || "_______"}</p>
                          </div>
                          <div className="mb-3 pb-3 border-b border-gray-100">
                            <p className="text-sm text-gray-500">Paper Type</p>
                            <p className="font-medium">{paperSettings.paperType || "_______"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Obtained Marks</p>
                            <p className="font-medium">{paperSettings.obtainedMarks || "_______"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Layout 9: Bottom border accent with three-column header and details in a clean layout */}
            {paperSettings.paperHeaderLayout === "Layout 9" && (
              <>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="font-bold mb-1" style={headerTextStyle}>
                        Superior College
                      </h1>
                      <p className="text-sm">Burewala Campus</p>
                    </div>
                    <div className="text-center">
                      <DynamicImage
                        src="/logo.png"
                        alt="School Logo"
                        width={paperSettings.logoWidth}
                        height={paperSettings.logoHeight}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">Academic Year: 2023-24</p>
                      <p className="text-sm">Term: Spring</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6" style={getTextStyle()}>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <div className="bg-white border-l-4 border-violet-500 pl-3 py-2 mb-4">
                        <p className="text-sm text-gray-500">Class</p>
                        <p className="font-medium">{paperSettings.class || "9th"}</p>
                      </div>
                      <div className="bg-white border-l-4 border-violet-500 pl-3 py-2 mb-4">
                        <p className="text-sm text-gray-500">Subject</p>
                        <p className="font-medium">{paperSettings.subject || "Biology"}</p>
                      </div>
                      <div className="bg-white border-l-4 border-violet-500 pl-3 py-2">
                        <p className="text-sm text-gray-500">Maximum Marks</p>
                        <p className="font-medium">{paperSettings.maximumMarks || "_______"}</p>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <div className="bg-white border-l-4 border-indigo-500 pl-3 py-2 mb-4">
                        <p className="text-sm text-gray-500">Student Name</p>
                        <p className="font-medium">{paperSettings.studentName || "_______"}</p>
                      </div>
                      <div className="bg-white border-l-4 border-indigo-500 pl-3 py-2 mb-4">
                        <p className="text-sm text-gray-500">Section</p>
                        <p className="font-medium">{paperSettings.section || "_______"}</p>
                      </div>
                      <div className="bg-white border-l-4 border-indigo-500 pl-3 py-2">
                        <p className="text-sm text-gray-500">Roll No.</p>
                        <p className="font-medium">{paperSettings.rollNo || "_______"}</p>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <div className="bg-white border-l-4 border-purple-500 pl-3 py-2 mb-4">
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium">{paperSettings.time || "_______"}</p>
                      </div>
                      <div className="bg-white border-l-4 border-purple-500 pl-3 py-2 mb-4">
                        <p className="text-sm text-gray-500">Paper Type</p>
                        <p className="font-medium">{paperSettings.paperType || "_______"}</p>
                      </div>
                      <div className="bg-white border-l-4 border-purple-500 pl-3 py-2">
                        <p className="text-sm text-gray-500">Obtained Marks</p>
                        <p className="font-medium">{paperSettings.obtainedMarks || "_______"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Layout 10: Diagonal gradient with centered content and details in a modern card layout */}
            {paperSettings.paperHeaderLayout === "Layout 10" && (
              <>
                <div className="p-6 text-center">
                  <DynamicImage
                    src="/logo.png"
                    alt="School Logo"
                    width={paperSettings.logoWidth}
                    height={paperSettings.logoHeight}
                    className="mx-auto mb-3"
                  />
                  <h1 className="font-bold mb-2" style={headerTextStyle}>
                    LEAP EVENING COACHING
                  </h1>
                  <div className="flex justify-center space-x-6 text-sm">
                    <span>•</span>
                    <span>Excellence</span>
                    <span>•</span>
                    <span>Integrity</span>
                    <span>•</span>
                    <span>Innovation</span>
                    <span>•</span>
                  </div>
                </div>
                <div className="p-6" style={getTextStyle()}>
                  <div className="bg-white rounded-lg shadow-md p-5">
                    <div className="grid grid-cols-3 gap-5">
                      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-4">
                        <p className="text-xs text-violet-500 uppercase mb-1">Class</p>
                        <p className="font-medium">{paperSettings.class || "9th"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-4">
                        <p className="text-xs text-violet-500 uppercase mb-1">Subject</p>
                        <p className="font-medium">{paperSettings.subject || "Biology"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg p-4">
                        <p className="text-xs text-violet-500 uppercase mb-1">Maximum Marks</p>
                        <p className="font-medium">{paperSettings.maximumMarks || "_______"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
                        <p className="text-xs text-indigo-500 uppercase mb-1">Student Name</p>
                        <p className="font-medium">{paperSettings.studentName || "_______"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
                        <p className="text-xs text-indigo-500 uppercase mb-1">Section</p>
                        <p className="font-medium">{paperSettings.section || "_______"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
                        <p className="text-xs text-indigo-500 uppercase mb-1">Roll No.</p>
                        <p className="font-medium">{paperSettings.rollNo || "_______"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4">
                        <p className="text-xs text-purple-500 uppercase mb-1">Time</p>
                        <p className="font-medium">{paperSettings.time || "_______"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4">
                        <p className="text-xs text-purple-500 uppercase mb-1">Paper Type</p>
                        <p className="font-medium">{paperSettings.paperType || "_______"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4">
                        <p className="text-xs text-purple-500 uppercase mb-1">Obtained Marks</p>
                        <p className="font-medium">{paperSettings.obtainedMarks || "_______"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Default layout for any other layout option */}
            {![
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
            ].includes(paperSettings.paperHeaderLayout) && (
              <>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <DynamicImage
                      src="/logo.png"
                      alt="School Logo"
                      width={paperSettings.logoWidth}
                      height={paperSettings.logoHeight}
                      className="mr-16"
                    />
                    <div className="flex-1 max-w-5xl mx-auto pl-8">
                      <h1 className="text-center font-bold mb-3" style={headerTextStyle}>
                        LEAP EVENING COACHING
                      </h1>
                      <p className="text-center text-sm">
                        P.E.C.H.S Block Civil Line Satellite Town Burewala District Vehari Punjab Pakistan
                        Ph:0301-6509222
                      </p>
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

      <style jsx global>{`
@media print {
  /* Reset the page margins and setup */
  @page {
    size: A4;
    margin: 0.5cm;
  }

  /* Print mode specific styles */
  body.print-mode {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background: white;
  }

  /* Hide non-printable elements */
  body.print-mode > *:not(.print-content) {
    display: none !important;
  }

  /* Hide UI elements */
  .bg-white.shadow-lg.p-2,
  .fixed.right-0.top-0.h-screen.w-96.bg-white.shadow-2xl,
  .fixed.top-20.right-4.z-50,
  .fixed.inset-0.z-50,
  button,
  .notification {
    display: none !important;
  }

  /* Style paper container */
  .paper-container {
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    width: 100% !important;
    position: relative !important;
    visibility: visible !important;
    page-break-after: avoid !important;
  }

  /* Ensure proper content flow */
  .mt-8.pl-16 {
    margin: 0 !important;
    padding: 0 0.5cm !important;
    position: relative !important;
    visibility: visible !important;
    page-break-before: avoid !important;
  }

  /* Question spacing */
  .mb-10 {
    margin-bottom: 1cm !important;
    page-break-inside: avoid !important;
  }

  /* Ensure proper page breaks */
  .question-section {
    page-break-inside: avoid !important;
    visibility: visible !important
  }

  /* Prevent page break after header */
  .bg-white.rounded-lg.shadow-xl.border.border-gray-200 > div:first-child {
    margin-bottom: 0.5cm;
    page-break-after: avoid !important;
  }

  /* Reset background colors and gradients */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    visibility: visible !important;
  }

  /* Ensure text remains visible */
  p, span, h1, h2, h3, h4, h5, h5, h6 {
    color: black !important;
    visibility: visible !important;
  }

  /* Maintain table borders */
  table, th, td {
    border-color: #000 !important;
    visibility: visible !important;
  }
  
  /* Fix overlapping content */
  .mt-8.pl-16 {
    clear: both;
    display: block;
    visibility: visible !important;
  }
  
  /* Ensure questions start immediately after header */
  .mt-8.pl-16:first-of-type {
    margin-top: 0 !important;
    padding-top: 0 !important;
  }
  
  /* Prevent content from being cut off */
  .mb-10:last-child {
    margin-bottom: 0 !important;
  }

  /* Adjust header layouts for print */
  [class*="Layout"] {
    background: none !important;
    background-color: white !important;
    background-image: none !important;
    visibility: visible !important;
  }

  /* Ensure tables print properly */
  table {
    width: 100% !important;
    page-break-inside: avoid !important;
    visibility: visible !important;
  }

  /* Ensure images print properly */
  img {
    max-width: 100% !important;
    page-break-inside: avoid !important;
    visibility: visible !important;
  }
}
`}</style>
    </div>
  )
}

// Add these arrays for settings options (copy from default-paper-settings)
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
  { name: "Default", family: "system-ui" },
  { name: "Arial", family: "Arial, sans-serif" },
  { name: "Algerian", family: "Algerian, serif" },
  { name: "Times New Roman", family: "'Times New Roman', serif" },
]

