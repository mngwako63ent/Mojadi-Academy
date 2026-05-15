import React, { useState } from 'react';
import { FileUp, X, Check, Loader2, Image as ImageIcon, AlertCircle, Download, BookOpen, FileText, Info, HelpCircle } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, Footer, Header } from 'docx';
import { saveAs } from 'file-saver';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { cn, stripUndefined } from '../../lib/utils';
import { useFeedback } from '../../components/FeedbackContext';

// Set worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface DocumentImporterProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export default function DocumentImporter({ onClose, onImportComplete }: DocumentImporterProps) {
  const { toast } = useFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.name.endsWith('.docx') || selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPreviewCourse(null);
    } else {
      toast("Invalid file type. Please upload a .docx or .pdf file.", "danger");
    }
  };

  const processDOCX = async (fileBuffer: ArrayBuffer) => {
    const options = {
      convertImage: mammoth.images.imgElement((element: any) => {
        return element.read("base64").then((imageBuffer: any) => {
          return {
            src: "data:" + element.contentType + ";base64," + imageBuffer
          };
        });
      })
    };

    const result = await mammoth.convertToHtml({ arrayBuffer: fileBuffer }, options);
    return parseHTMLToCourse(result.value);
  };

  const processPDF = async (fileBuffer: ArrayBuffer) => {
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    let htmlStr = '';
    
    // Very basic heuristic parser for PDF based on font sizes
    for (let i = 1; i <= pdf.numPages; i++) {
       const page = await pdf.getPage(i);
       const textContent = await page.getTextContent();
       
       let lastY = -1;
       let currentLine = '';
       let maxFontSize = 0;

       textContent.items.forEach((item: any) => {
          if (lastY !== item.transform[5] && currentLine) {
             // new line
             if (maxFontSize > 20) {
                htmlStr += `<h1>${currentLine}</h1>`;
             } else if (maxFontSize > 15) {
                htmlStr += `<h2>${currentLine}</h2>`;
             } else {
                htmlStr += `<p>${currentLine}</p>`;
             }
             currentLine = item.str;
             maxFontSize = item.transform[0];
          } else {
             currentLine += item.str;
             maxFontSize = Math.max(maxFontSize, item.transform[0]);
          }
          lastY = item.transform[5];
       });

       if (currentLine) {
          if (maxFontSize > 20) htmlStr += `<h1>${currentLine}</h1>`;
          else if (maxFontSize > 15) htmlStr += `<h2>${currentLine}</h2>`;
          else htmlStr += `<p>${currentLine}</p>`;
       }
    }
    
    return parseHTMLToCourse(htmlStr);
  };

  const downloadTemplate = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "Module 1: What is Crop Production?",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: "This module introduces the basic science of agriculture.",
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Lesson 1.1: Definition and Scope",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: "Crop production is the science and practice of growing plants for food, fibre, fuel, and other uses.",
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "The scope includes:" }),
            new Paragraph({ text: "• Field crops (maize, wheat)", bullet: { level: 0 } }),
            new Paragraph({ text: "• Vegetable crops (onions, peppers)", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Lesson 1.2: Importance of Crops",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: "Agriculture contributes significantly to the GDP of developing nations.",
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Key Fact: Agriculture employs over 1 billion people worldwide.",
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Module 2: Assessments",
              heading: HeadingLevel.HEADING_1,
            }),
             new Paragraph({
              text: "Lesson 2.1: Practice Quiz",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: "Question 1: Which of the following defines crop production?",
            }),
            new Paragraph({ text: "a. Harvesting wild plants" }),
            new Paragraph({
              children: [
                new TextRun({ text: "b. Deliberate cultivation of plants", bold: true }),
              ],
            }),
            new Paragraph({ text: "c. Breeding animals" }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Memorandum: Crop production refers to the deliberate cultivation of plants." }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "MojadiAcademy_Course_Template.docx");
    toast("Course Template downloaded successfully!", "success");
  };

  const parseHTMLToCourse = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const modules: any[] = [];
    let currentModule: any = null;
    let currentLesson: any = null;
    let currentQuestion: any = null;
    let currentLessonContent = '';
    const warnings: string[] = [];
    
    let state: 'module' | 'lesson' | 'objectives' | 'assessment' = 'module';

    const saveCurrentLesson = () => {
      if (currentLesson && currentModule) {
         currentLesson.content = currentLessonContent;
         currentModule.topics.push({...currentLesson});
      }
      currentLesson = null;
      currentLessonContent = '';
    };

    const saveCurrentQuestion = () => {
      if (currentQuestion && currentModule) {
         if (currentQuestion.options.length === 0 && currentQuestion.type !== 'written') {
           // If no options were found, convert to written
           currentQuestion.type = 'written';
         }
         currentModule.quiz.push({...currentQuestion});
      }
      currentQuestion = null;
    };

    const saveCurrentModule = () => {
      saveCurrentLesson();
      saveCurrentQuestion();
      if (currentModule) {
         modules.push({...currentModule});
      }
    };

    const children = Array.from(doc.body.children);
    const courseObjectives: string[] = [];
    
    // Extraction of Course-Level Objectives
    let foundFirstHeading = false;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.tagName === 'H1' || node.tagName === 'H2') {
        const textLower = node.textContent?.toLowerCase() || '';
        if (textLower.includes('module') || textLower.includes('lesson')) {
          foundFirstHeading = true;
          break;
        }
        if (textLower.includes('objective') || textLower.includes('goal')) {
          let j = i + 1;
          while (j < children.length && children[j].tagName !== 'H1' && children[j].tagName !== 'H2') {
            if (children[j].tagName === 'UL' || children[j].tagName === 'OL') {
              Array.from(children[j].children).forEach(li => {
                if (li.textContent) courseObjectives.push(li.textContent.trim());
              });
            } else if (children[j].textContent?.trim().startsWith('•') || children[j].textContent?.trim().startsWith('-')) {
              courseObjectives.push(children[j].textContent!.trim().replace(/^[•\-]+\s*/, ''));
            }
            j++;
          }
        }
      }
    }
    
    // Smart Validation: Check for basic hierarchy
    const hasH1 = children.some(n => n.tagName === 'H1');
    const hasH2 = children.some(n => n.tagName === 'H2');
    
    if (!hasH1) warnings.push("Missing Heading 1: No module titles detected. Everything will be put in a 'General Module'.");
    if (!hasH2) warnings.push("Missing Heading 2: No lesson titles detected. Content might not be split correctly.");

    children.forEach((node) => {
      if (node.tagName === 'H1') {
        saveCurrentModule();
        currentModule = {
          id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: node.textContent?.trim() || 'Untitled Module',
          description: '',
          learningObjectives: [],
          topics: [],
          quiz: [],
          assessment: null
        };
        state = 'module';
      } else if (node.tagName === 'H2') {
        const textStr = node.textContent?.trim().toLowerCase() || '';
        
        if (textStr.includes('learning objective')) {
          saveCurrentLesson();
          saveCurrentQuestion();
          state = 'objectives';
        } else if (textStr.includes('assessment') || textStr.includes('quiz')) {
          saveCurrentLesson();
          saveCurrentQuestion();
          state = 'assessment';
        } else {
          // It's a regular Lesson
          saveCurrentLesson();
          saveCurrentQuestion();
          if (!currentModule) {
            currentModule = {
              id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: 'General Module',
              description: '',
              learningObjectives: [],
              topics: [],
              quiz: [],
              assessment: null
            };
          }
          currentLesson = {
            id: `les-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: node.textContent?.trim() || 'Untitled Lesson',
            type: 'text',
            duration: '10 mins',
            content: '',
            videoUrl: '',
            attachments: []
          };
          state = 'lesson';
        }
      } else if (node.tagName === 'H3' && state === 'assessment') {
         saveCurrentQuestion();
         currentQuestion = {
            id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'multiple_choice',
            question: node.textContent?.trim() || '',
            options: [],
            correctAnswer: 0,
            points: 10,
            modelAnswer: '',
            maxMarks: ''
         };
      } else {
         const text = node.textContent?.trim() || '';
         
         if (text.toLowerCase().startsWith('question') || (text.toLowerCase().startsWith('q') && /\d+[:.]/.test(text.toLowerCase()))) {
            // New Question found in regular text
            saveCurrentQuestion();
            if (state !== 'assessment') {
               saveCurrentLesson();
               state = 'assessment';
            }
            currentQuestion = {
               id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
               type: 'multiple_choice',
               question: text.replace(/^(Question|Q)\s*\d+[:.]?\s*/i, ''),
               options: [],
               correctAnswer: 0,
               points: 10,
               modelAnswer: '',
               maxMarks: ''
            };
         } else if (state === 'objectives') {
            if (node.tagName === 'UL' || node.tagName === 'OL') {
               Array.from(node.children).forEach(li => {
                  if (li.textContent) currentModule?.learningObjectives.push(li.textContent.trim());
               });
            } else if (text.startsWith('•') || text.startsWith('-') || text.match(/^\d+\./)) {
               currentModule?.learningObjectives.push(text.replace(/^[•\-\d\.]+\s*/, '').trim());
            } else if (text) {
               currentModule?.learningObjectives.push(text);
            }
         } else if (state === 'assessment') {
            if (!currentQuestion) {
               currentQuestion = {
                  id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: 'multiple_choice',
                  question: text,
                  options: [],
                  correctAnswer: 0,
                  points: 10,
                  modelAnswer: '',
                  maxMarks: ''
               };
            } else if (text.startsWith('Q:') && !currentQuestion.question) {
               currentQuestion.question = text.substring(2).trim();
            } else if (/^[a-zA-Z][\.\)]/i.test(text) || /^[0-9]+[\.\)]\s*(true|false)/i.test(text) || text.startsWith('[ ]') || text.startsWith('[CORRECT]')) {
               const optionText = text.replace(/^(\[.*?\]\s*|[a-zA-Z][\.\)]\s*|[0-9]+[\.\)]\s*)/i, '').trim();
               currentQuestion.options.push(optionText);
               
               const isBold = node.querySelector('strong') !== null || node.querySelector('b') !== null || node.tagName === 'STRONG' || node.tagName === 'B';
               if (isBold || text.startsWith('[CORRECT]')) {
                 currentQuestion.correctAnswer = currentQuestion.options.length - 1;
               }
            } else if (text.toLowerCase().startsWith('correct answer:')) {
               const ans = text.replace(/correct answer:/i, '').trim();
               // check if ans matches any option
               const matchedIdx = currentQuestion.options.findIndex((opt: string) => opt.toLowerCase() === ans.toLowerCase() || opt.toLowerCase().startsWith(ans.toLowerCase()));
               if (matchedIdx !== -1) {
                  currentQuestion.correctAnswer = matchedIdx;
               } else if (ans.toLowerCase() === 'written' || currentQuestion.options.length === 0) {
                  currentQuestion.type = 'written';
                  currentQuestion.correctAnswer = ans;
               } else {
                  currentQuestion.type = 'multiple_choice';
                  const charCode = ans.toUpperCase().charCodeAt(0);
                  if (charCode >= 65 && charCode <= 69) { // A-E
                     currentQuestion.correctAnswer = charCode - 65;
                  } else {
                     currentQuestion.correctAnswer = 0; // Fallback
                  }
               }
            } else if (text.toLowerCase().startsWith('memorandum:') || text.toLowerCase().startsWith('model answer:')) {
               currentQuestion.modelAnswer = text.replace(/^(memorandum|model answer):/i, '').trim();
            } else if (text.toLowerCase().startsWith('marks:')) {
               currentQuestion.maxMarks = text.replace(/marks:/i, '').trim();
            } else if (text && !currentQuestion.question) {
               currentQuestion.question = text;
            } else if (text) {
               if (currentQuestion.options.length === 0) {
                 currentQuestion.question += '\n' + text;
               }
            }
         } else if (state === 'lesson') {
            if (!currentLesson) {
               currentLesson = {
                 id: `les-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                 title: 'Introduction',
                 type: 'text',
                 duration: '10 mins',
                 content: '',
               };
               if (!currentModule) {
                 currentModule = {
                    id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: 'General Module',
                    description: '',
                    learningObjectives: [],
                    topics: [],
                    quiz: [],
                    assessment: null
                 };
               }
            }

            // Detect Metadata (Type/Duration)
            const isMetaLine = (text.toLowerCase().startsWith('type:') || text.toLowerCase().startsWith('duration:')) || 
                           (text.includes('|') && (text.includes('Type:') || text.includes('Duration:')));
            
            if (isMetaLine) {
                  const parts = text.split('|');
                  parts.forEach(p => {
                     const clean = p.trim();
                     if (clean.toLowerCase().startsWith('type:')) {
                        const val = clean.replace(/type:/i, '').trim().toLowerCase();
                        if (['text', 'video', 'quiz', 'document'].includes(val)) {
                           currentLesson.type = val;
                        }
                     }
                     if (clean.toLowerCase().startsWith('duration:')) {
                        currentLesson.duration = clean.replace(/duration:/i, '').trim();
                     }
                  });
                  return; // Skip adding metadata line to content
            }

            let nodeHtml = node.outerHTML;
            
            if (node.tagName === 'P') {
              if (/^Key Fact:/i.test(text)) {
                 const factText = text.replace(/^Key Fact:/i, '').trim();
                 nodeHtml = `<div class="p-6 bg-secondary/10 border-l-4 border-secondary rounded-r-xl my-6">
                   <p class="text-xs font-black uppercase tracking-widest text-secondary mb-2">Key Fact</p>
                   <p class="font-bold text-slate-800">${factText}</p>
                 </div>`;
              } else if (/^[•\-\*\·]\s/.test(text)) {
                const cleanedText = text.replace(/^[•\-\*\·]\s*/, '').trim();
                nodeHtml = `<ul style="list-style-type: disc; margin-left: 2rem; margin-bottom: 0.5rem;"><li>${cleanedText}</li></ul>`;
              } else if (/^\d+\.\s/.test(text)) {
                const cleanedText = text.replace(/^\d+\.\s*/, '').trim();
                // We use ul with decimal for simplicity instead of wrapping multiple items in ol
                nodeHtml = `<ul style="list-style-type: decimal; margin-left: 2rem; margin-bottom: 0.5rem;"><li>${cleanedText}</li></ul>`;
              }
            } else if (node.tagName === 'TABLE') {
               const wrapper = doc.createElement('div');
               wrapper.className = 'ql-table-container';
               
               // Let .prose styles handle most things, just ensure basic structure
               node.removeAttribute('style');
               node.className = ''; 
               
               const cells = Array.from(node.querySelectorAll('td, th'));
               cells.forEach(c => {
                 c.removeAttribute('style');
                 c.className = '';
               });
               
               // Wrap the table
               node.parentNode?.replaceChild(wrapper, node);
               wrapper.appendChild(node);
               nodeHtml = wrapper.outerHTML;
            }

            currentLessonContent += nodeHtml;
         } else if (state === 'module') {
            if (currentModule && !currentModule.description && node.tagName === 'P') {
               currentModule.description = text;
            }
         }
      }
    });

    saveCurrentModule();
    setValidationWarnings(warnings);

    return {
       title: file?.name.replace(/\.[^/.]+$/, "") || 'Imported Course',
       description: 'Generated via Document Importer',
       price: 0,
       thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop',
       image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop',
       level: 'beginner',
       duration: '10 hours',
       category: 'Imported',
       instructor: 'Admin',
       rating: 0,
       reviews: 0,
       students: 0,
       modules: modules,
       materials: [],
       learningObjectives: courseObjectives.length > 0 ? courseObjectives : ['Complete the modules and assessments successfully.'],
       status: 'draft'
    };
  };

  const handleGeneratePreview = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      let courseData;
      if (file.name.endsWith('.docx')) {
        courseData = await processDOCX(buffer);
      } else if (file.type === 'application/pdf') {
        courseData = await processPDF(buffer);
      }
      setPreviewCourse(courseData);
    } catch (err: any) {
      console.error(err);
      toast(`Failed to process document: ${err.message}`, "danger");
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadBase64Image = async (base64Str: string): Promise<string> => {
    try {
      const res = await fetch(base64Str);
      const blob = await res.blob();
      const storageRef = ref(storage, `courses/imported/${Date.now()}_${Math.random().toString(36).substr(2, 5)}.png`);
      
      // Use uploadBytes for simple, non-resumable upload of small images
      const { uploadBytes } = await import('firebase/storage');
      const snapshot = await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (err) {
      console.error("Failed to upload inline image", err);
      throw err;
    }
  };

  const handlePublish = async () => {
    if (!previewCourse) return;
    
    // Strict Structure Validation
    if (!previewCourse.modules || previewCourse.modules.length === 0) {
       toast("Validation Failed: The uploaded document resulted in an empty course with no modules. Please check the heading structures.", "danger");
       return;
    }

    let isValid = true;
    for (let i = 0; i < previewCourse.modules.length; i++) {
       const mod = previewCourse.modules[i];
       if (!mod.id || !mod.title) {
          toast(`Validation Failed: Module ${i + 1} is missing a required id or title.`, "danger");
          isValid = false;
          break;
       }
       if (!mod.topics || mod.topics.length === 0) {
          toast(`Validation Failed: Module '${mod.title}' has no lessons. Every H1 module must contain at least one H2 lesson.`, "danger");
          isValid = false;
          break;
       }
       for (let j = 0; j < mod.topics.length; j++) {
           const topic = mod.topics[j];
           if (!topic.id || !topic.title || !topic.content) {
               toast(`Validation Failed: Lesson ${j + 1} in '${mod.title}' is missing a title or content.`, "danger");
               isValid = false;
               break;
           }
       }
       if (!isValid) break;
    }

    if (!isValid) return;

    setIsPublishing(true);
    try {
      // 1. First, process all images in the lessons
      const FinalCourse = JSON.parse(JSON.stringify(previewCourse));

      for (let m = 0; m < FinalCourse.modules.length; m++) {
        const mod = FinalCourse.modules[m];
        
        // Ensure arrays are initialized to prevent downstream crashes
        if (!mod.learningObjectives) mod.learningObjectives = [];
        if (!mod.quiz) mod.quiz = [];
        if (!mod.assessment) mod.assessment = null;

        for (let l = 0; l < mod.topics.length; l++) {
           const lesson = mod.topics[l];
           
           if (!lesson.content) continue;

           // Parse lesson content to find data: images
           const parser = new DOMParser();
           const doc = parser.parseFromString(lesson.content, 'text/html');
           const images = doc.getElementsByTagName('img');
           
           for (let i = 0; i < images.length; i++) {
             const img = images[i];
             if (img.src.startsWith('data:image')) {
                try {
                   const url = await uploadBase64Image(img.src);
                   img.src = url; // replace with firebase storage url
                } catch(err) {
                   console.error("Failed to upload inline image", err);
                }
             }
           }
           lesson.content = doc.body.innerHTML; 
        }
      }

      // 2. Publish to Firestore
      FinalCourse.createdAt = serverTimestamp();
      FinalCourse.updatedAt = serverTimestamp();

      const cleanCourse = stripUndefined(FinalCourse);
      await addDoc(collection(db, 'courses'), cleanCourse);

      toast("Course imported and published successfully!", "success");
      onImportComplete();
    } catch (err: any) {
      console.error(err);
      toast(`Failed to publish course: ${err.message}`, "danger");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 relative my-8">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-black text-slate-800">Document Importer</h2>
            <p className="text-sm font-medium text-slate-500">Convert DOCX or PDF files into complete courses automatically.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Instructions & Template */}
          {!previewCourse && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="glass p-6 rounded-3xl border-slate-100 space-y-6">
                  <div className="flex items-center gap-3 text-secondary">
                    <Info size={24} />
                    <h3 className="font-bold text-lg">Import Guide</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold text-sm">H1</div>
                      <div>
                        <p className="font-bold text-sm">Module Titles</p>
                        <p className="text-xs text-slate-500">Use Heading 1 for modules.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center shrink-0 font-bold text-sm">H2</div>
                      <div>
                        <p className="font-bold text-sm">Lesson Titles</p>
                        <p className="text-xs text-slate-500">Use Heading 2 for lessons.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-bold text-sm">¶</div>
                      <div>
                        <p className="font-bold text-sm">Lesson Content</p>
                        <p className="text-xs text-slate-500">Regular text becomes content.</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />
                  
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resources</p>
                    <button 
                      onClick={downloadTemplate}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="text-slate-600" size={20} />
                        <span className="font-bold text-sm">DOCX Template</span>
                      </div>
                      <Download size={18} className="text-slate-400 group-hover:text-secondary transition-colors" />
                    </button>
                    
                    <button 
                      onClick={() => setShowGuide(true)}
                      className="w-full flex items-center justify-between p-4 bg-secondary/5 hover:bg-secondary/10 rounded-2xl border border-secondary/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle className="text-secondary" size={20} />
                        <span className="font-bold text-sm text-secondary">Structure Guide</span>
                      </div>
                      <Info size={18} className="text-secondary/40" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                {/* Upload Area */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={cn(
                    "h-full border-2 border-dashed rounded-[2rem] p-12 text-center transition-all flex flex-col items-center justify-center min-h-[400px]",
                    file ? "border-secondary/50 bg-secondary/5" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                  )}
                >
                  <div className="w-24 h-24 bg-white shadow-xl shadow-slate-200/40 rounded-full flex items-center justify-center mb-8 text-secondary">
                    {isProcessing ? <Loader2 className="animate-spin" size={40} /> : <FileUp size={40} />}
                  </div>
                  
                  {!file ? (
                    <>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">Drag & Drop your document</h3>
                      <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">Upload a formatted .docx or .pdf and we'll build your course modules automatically.</p>
                      <label className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold font-display shadow-2xl hover:bg-slate-800 transition-all cursor-pointer inline-flex items-center gap-3">
                        <FileUp size={20} />
                        Upload Document
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".docx,application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) handleFileSelection(e.target.files[0]);
                          }}
                        />
                      </label>
                    </>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                       <h3 className="text-2xl font-bold text-slate-800 mb-2">{file.name}</h3>
                       <p className="text-secondary font-bold mb-8">Ready to process {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                       
                       <div className="flex justify-center gap-4">
                         <button onClick={() => setFile(null)} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                           Reset
                         </button>
                         <button 
                           onClick={handleGeneratePreview} 
                           disabled={isProcessing}
                           className="px-10 py-4 bg-secondary text-white rounded-2xl font-bold shadow-xl shadow-secondary/30 hover:bg-secondary/90 disabled:opacity-50 transition-all flex items-center gap-2"
                         >
                           {isProcessing ? (
                             <>
                               <Loader2 className="animate-spin" size={20} />
                               Analyzing...
                             </>
                           ) : (
                             <>
                               <Check size={20} />
                               Process Document
                             </>
                           )}
                         </button>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Guide Modal */}
          {showGuide && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
              <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-secondary/20">
                      <HelpCircle size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Structure Guide</h3>
                      <p className="text-sm text-slate-500 font-medium">How to format your documents for perfect imports.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowGuide(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                  <section className="space-y-4">
                    <h4 className="font-bold text-secondary uppercase tracking-widest text-xs">Hierarchy Rules</h4>
                    <div className="space-y-3">
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xl text-slate-900">Heading 1</span>
                          <span className="text-xs font-bold text-slate-400">→</span>
                          <span className="font-bold text-sm text-secondary">Module Title</span>
                        </div>
                        <p className="text-sm text-slate-600">Each Heading 1 starts a new module group.</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-slate-900">Heading 2</span>
                          <span className="text-xs font-bold text-slate-400">→</span>
                          <span className="font-bold text-sm text-secondary">Lesson Title</span>
                        </div>
                        <p className="text-sm text-slate-600">Each Heading 2 creates a new lesson within the current module.</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">Normal Text / Lists / Tables / Images</span>
                          <span className="text-xs font-bold text-slate-400">→</span>
                          <span className="font-bold text-sm text-secondary">Lesson Content</span>
                        </div>
                        <p className="text-sm text-slate-600">All content following a Heading 2 belongs to that lesson.</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-bold text-secondary uppercase tracking-widest text-xs">Best Practices</h4>
                    <ul className="grid sm:grid-cols-2 gap-4">
                      {[
                        "Use clear, descriptive headings",
                        "Include images directly in DOCX",
                        "Use standard Word bullet points",
                        "Tables are fully supported",
                        "Keep lesson content focused",
                        "Avoid nested deep hierarchies"
                      ].map((tip, i) => (
                        <li key={i} className="flex gap-3 text-sm font-medium text-slate-600">
                          <Check size={18} className="text-green-500 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => setShowGuide(false)}
                    className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl"
                  >
                    Got It
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preview Area */}
          {previewCourse && (
            <div className="space-y-6">
              {validationWarnings.length > 0 && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-3xl space-y-3">
                  <div className="flex items-center gap-3 text-red-600">
                    <AlertCircle size={20} />
                    <h4 className="font-bold">Structure Warnings</h4>
                  </div>
                  <ul className="space-y-1 ml-8">
                    {validationWarnings.map((w, i) => (
                      <li key={i} className="text-sm text-red-700 font-medium list-disc">{w}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-500 italic mt-2 ml-8">Formatting warnings won't block you, but might lead to unstructured modules.</p>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
                 <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="text-amber-600" />
                    <div>
                      <p className="font-bold text-sm">Please review the imported structure.</p>
                      <p className="text-xs font-medium opacity-80">Images will be automatically extracted and uploaded to storage upon publishing.</p>
                    </div>
                 </div>
                 <button onClick={() => setPreviewCourse(null)} className="px-4 py-2 bg-white rounded-lg font-bold text-sm border border-amber-200">Start Over</button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                 <div className="p-6 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-2xl font-bold mb-2">
                       <input 
                         type="text" 
                         value={previewCourse.title} 
                         onChange={(e) => setPreviewCourse({...previewCourse, title: e.target.value})}
                         className="bg-transparent border-none outline-none w-full focus:ring-2 focus:ring-secondary rounded p-1"
                       />
                    </h3>
                    <p className="text-sm font-medium text-slate-500">{previewCourse.modules?.length || 0} Modules • {previewCourse.modules?.reduce((acc: number, m: any) => acc + (m.topics?.length || 0), 0) || 0} Lessons</p>
                 </div>

                 <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
                    {previewCourse?.modules?.map((module: any, mIdx: number) => (
                      <div key={mIdx} className="border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm bg-white">
                         <input 
                           type="text"
                           value={module.title}
                           onChange={(e) => {
                             const newModules = [...previewCourse.modules];
                             newModules[mIdx].title = e.target.value;
                             setPreviewCourse({...previewCourse, modules: newModules});
                           }}
                           className="text-lg font-bold w-full bg-slate-50 p-2 rounded-lg border border-transparent focus:border-slate-300 outline-none"
                         />
                         
                         <div className="pl-4 space-y-2 border-l-2 border-slate-100">
                           {module.topics?.map((lesson: any, lIdx: number) => (
                             <div key={lIdx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <input 
                                  type="text"
                                  value={lesson.title}
                                  onChange={(e) => {
                                    const newModules = [...previewCourse.modules];
                                    newModules[mIdx].topics[lIdx].title = e.target.value;
                                    setPreviewCourse({...previewCourse, modules: newModules});
                                  }}
                                  className="text-sm font-bold w-full bg-transparent border border-transparent focus:border-slate-300 outline-none p-1 rounded"
                                />
                                <div className="mt-2 text-xs text-slate-500 overflow-hidden line-clamp-2" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                                {lesson.content.includes('<img') && (
                                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-secondary uppercase bg-secondary/10 w-max px-2 py-1 rounded">
                                    <ImageIcon size={12} /> Image Detected
                                  </div>
                                )}
                             </div>
                           ))}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {previewCourse && (
           <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex justify-end gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
             <button onClick={onClose} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
             <button 
               onClick={handlePublish}
               disabled={isPublishing}
               className="flex items-center gap-2 px-8 py-3 bg-secondary text-white rounded-xl font-bold shadow-xl shadow-secondary/30 hover:scale-105 disabled:opacity-50 transition-all"
             >
               {isPublishing ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
               Publish Course to LMS
             </button>
           </div>
        )}
      </div>
    </div>
  );
}
