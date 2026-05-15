import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Eye, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Layers, 
  FileText, 
  Video, 
  Image as ImageIcon,
  Save,
  X,
  PlusCircle,
  FileUp,
  GripVertical,
  BookOpen
} from 'lucide-react';
import { db, storage, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from 'firebase/storage';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { cn, formatPrice, stripUndefined } from '../../lib/utils';
import { courses as initialCourses } from '../../data/courses';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { useFeedback } from '../../components/FeedbackContext';

import DocumentImporter from './DocumentImporter';

const CourseCMS = () => {
  const { alert, confirm, toast } = useFeedback();
  const [isImporting, setIsImporting] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [searchParams] = useState(new URLSearchParams(window.location.search));

  // Module Modal State
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModuleIdx, setEditingModuleIdx] = useState<number | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', introduction: '', learningObjectives: '' });

  // Lesson Modal State
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingLessonIdx, setEditingLessonIdx] = useState<{ moduleIdx: number, lessonIdx: number | null }>({ moduleIdx: 0, lessonIdx: null });
  const [lessonForm, setLessonForm] = useState({ title: '', type: 'video' as 'video' | 'quiz' | 'text' | 'document', duration: '', content: '', videoUrl: '', attachments: [] as {title: string, url: string}[] });
  const [attachmentForm, setAttachmentForm] = useState({ title: '', url: '' });

  // Objective Modal State
  const [isAddingObjective, setIsAddingObjective] = useState(false);
  const [objectiveText, setObjectiveText] = useState('');
  const [editingObjectiveIdx, setEditingObjectiveIdx] = useState<number | null>(null);
  const [isAddingAssessment, setIsAddingAssessment] = useState(false);
  const [isAddingQuiz, setIsAddingQuiz] = useState(false);
  const [editingModuleAssessIdx, setEditingModuleAssessIdx] = useState<number | null>(null);
  const [assessmentForm, setAssessmentForm] = useState<any>({
    title: '',
    description: '',
    type: 'report',
    sections: []
  });
  const [sectionForm, setSectionForm] = useState<any>({
    title: '',
    description: '',
    questions: []
  });
  const [quizForm, setQuizForm] = useState<any>([]);
  const [questionForm, setQuestionForm] = useState<any>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  // Material Modal State
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [materialForm, setMaterialForm] = useState({ title: '', url: '', type: 'PDF' });

  // Upload State
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const uploadTasks = React.useRef<{ [key: string]: any }>({});
  const isUploading = Object.keys(uploadProgress).length > 0;

  const handleFileUpload = (file: File, path: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      console.log(`Starting upload for ${file.name} to ${path}. Size: ${file.size} bytes`);
      
      if (!auth.currentUser) {
        console.error('No authenticated user found');
        toast('You must be signed in to upload files', 'error' as any);
        return reject(new Error('Not authenticated'));
      }

      // Sanitize filename to avoid path issues
      const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase() || 'unnamed_file';
      const fileId = `${Date.now()}_${sanitizedName}`;
      
      // Initialize progress immediately
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        const storageRef = ref(storage, `${path}/${fileId}`);
        
        // Try to read file as ArrayBuffer first - often more reliable than passing File object directly
        const arrayBuffer = await file.arrayBuffer();
        
        // For small images (< 2MB), try uploadString as it can bypass some binary proxy issues
        if (file.type.startsWith('image/') && file.size < 2 * 1024 * 1024) {
          console.log('Attempting uploadString for small image');
          try {
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((res, rej) => {
              reader.onload = () => res(reader.result as string);
              reader.onerror = rej;
              reader.readAsDataURL(file);
            });
            
            setUploadProgress(prev => ({ ...prev, [fileId]: 30 }));
            const { uploadString } = await import('firebase/storage');
            const result = await uploadString(storageRef, dataUrl, 'data_url');
            setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
            const downloadURL = await getDownloadURL(result.ref);
            
            setTimeout(() => {
              setUploadProgress(prev => {
                const next = { ...prev };
                delete next[fileId];
                return next;
              });
            }, 500);
            return resolve(downloadURL);
          } catch (stringErr) {
            console.warn('uploadString failed, falling back to uploadBytes:', stringErr);
          }
        }

        console.log('Using uploadBytes with ArrayBuffer');
        setUploadProgress(prev => ({ ...prev, [fileId]: 10 }));
        
        try {
          // Use uploadBytes with arrayBuffer instead of file
          const snapshot = await uploadBytes(storageRef, arrayBuffer);
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          setTimeout(() => {
            setUploadProgress(prev => {
              const next = { ...prev };
              delete next[fileId];
              return next;
            });
          }, 500);
          
          return resolve(downloadURL);
        } catch (error: any) {
          console.error('uploadBytes with ArrayBuffer failed:', error);
          
          // If we get retry-limit-exceeded, it's likely CORS or environment related
          if (error.code === 'storage/retry-limit-exceeded') {
            toast('Network issue or Storage not configured. Please check connection.', 'error' as any);
          }

          // Final fallback to resumable if simple upload fails
          console.log('Fallback to uploadBytesResumable');
          const uploadTask = uploadBytesResumable(storageRef, file);
          uploadTasks.current[fileId] = uploadTask;

          const timeoutId = setTimeout(() => {
            uploadTask.cancel();
            reject(new Error('Upload timed out.'));
          }, 600000);

          uploadTask.on('state_changed',
            (snap) => {
              const progress = (snap.bytesTransferred / snap.totalBytes) * 100;
              setUploadProgress(prev => ({ ...prev, [fileId]: Math.min(Math.round(progress), 99) }));
            },
            (err) => {
              clearTimeout(timeoutId);
              delete uploadTasks.current[fileId];
              setUploadProgress(prev => {
                const next = { ...prev };
                delete next[fileId];
                return next;
              });
              reject(err);
            },
            async () => {
              clearTimeout(timeoutId);
              setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              delete uploadTasks.current[fileId];
              setTimeout(() => {
                setUploadProgress(prev => {
                  const next = { ...prev };
                  delete next[fileId];
                  return next;
                });
              }, 500);
              resolve(url);
            }
          );
        }
      } catch (err: any) {
        console.error('Outer upload error:', err);
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
        reject(err);
      }
    });
  };

  // Form State
  const [courseForm, setCourseForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    price: 0,
    category: 'Crop Production',
    level: 'Beginner',
    duration: '',
    thumbnail: '',
    image: '',
    status: 'draft' as const
  });

   // Course Details Editor State
  const [editorForm, setEditorForm] = useState<any>(null);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'courses'), orderBy('createdAt', 'desc')), (snapshot) => {
      const dbDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Merge with initial courses
      const merged: any[] = [...dbDocs];
      initialCourses.forEach(sc => {
        if (!dbDocs.some(dc => dc.id === sc.id)) {
          // Check if this static course should be considered "published" by default if not shadowed
          // Actually, let's keep them as draft until admin confirms saving to DB
          merged.push({ ...sc, status: 'draft', isStatic: true });
        }
      });
      
      setCourses(merged);
      
      // Handle initial selection from URL if present
      const initialId = searchParams.get('id');
      if (initialId && !selectedCourse) {
        const found = merged.find(d => d.id === initialId);
        if (found) {
           setSelectedCourse(found);
           setEditorForm(found);
        }
      }

      if (selectedCourse) {
        const updated = merged.find(d => d.id === selectedCourse.id);
        if (updated) {
           setSelectedCourse(updated);
        }
      }
      
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, [selectedCourse?.id, searchParams]);

  // When manually selecting a course from the list
  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    setEditorForm(course);
  };

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCourse = async () => {
    if (!courseForm.title.trim()) {
      await alert("A course title is required to create a course.");
      return;
    }
    setIsCreating(true);
    try {
      const docRef = await addDoc(collection(db, 'courses'), stripUndefined({
        ...courseForm,
        image: courseForm.thumbnail || courseForm.image,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        students: 0,
        rating: 5.0,
        learningObjectives: [],
        modules: [],
        materials: []
      }));
      
      // Auto-select the new course
      const newCourse = {
        id: docRef.id,
        ...courseForm,
        students: 0,
        rating: 5.0,
        learningObjectives: [],
        modules: [],
        materials: []
      };
      setSelectedCourse(newCourse);
      
      setIsAddingCourse(false);
      setCourseForm({
        title: '',
        subtitle: '',
        description: '',
        price: 0,
        category: 'Crop Production',
        level: 'Beginner',
        duration: '',
        thumbnail: '',
        image: '',
        status: 'draft'
      });
      toast("Course created successfully!", "success" as any);
    } catch (error) {
      console.error(error);
      toast("Failed to create course. Please try again.", "error" as any);
      handleFirestoreError(error, OperationType.CREATE, 'courses');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveCourseDetails = async () => {
    if (!selectedCourse || !editorForm) return;

    const isConfirmed = await confirm("Are you sure you want to save these course details?");
    if (!isConfirmed) return;

    setIsSavingDetails(true);
    try {
      const { id, createdAt, updatedAt, ...updates } = editorForm;
      await handleUpdateCourse(selectedCourse.id, updates);
      toast('Course details saved successfully.', 'success');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleUpdateCourse = async (id: string, updates: any) => {
    try {
      const { setDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'courses', id);
      
      await setDoc(docRef, stripUndefined({
        ...updates,
        updatedAt: serverTimestamp(),
        // Only set createdAt if it doesn't exist (Firestore handles this via serverTimestamp if we check existence, 
        // but setDoc with merge is simpler. To truly preserve createdAt, we'd need a get() first.)
      }), { merge: true });
      
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `courses/${id}`);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    const isConfirmed = await confirm("Are you sure you want to delete this course? This action cannot be undone.");
    if (!isConfirmed) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
      if (selectedCourse?.id === id) setSelectedCourse(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `courses/${id}`);
    }
  };

  // Module Handlers
  const handleOpenModuleModal = (idx: number | null = null) => {
    if (idx !== null && selectedCourse.modules?.[idx]) {
      setEditingModuleIdx(idx);
      const mod = selectedCourse.modules[idx];
      setModuleForm({
        title: mod.title || '',
        description: mod.description || '',
        introduction: mod.introduction || '',
        learningObjectives: (mod.learningObjectives || []).join('\n')
      });
    } else {
      setEditingModuleIdx(null);
      setModuleForm({ title: '', description: '', introduction: '', learningObjectives: '' });
    }
    setIsAddingModule(true);
  };

  const handleSaveModule = async () => {
    if (!selectedCourse) return;
    if (!moduleForm.title.trim()) {
      await alert("Module title is required.");
      return;
    }
    const modules = [...(selectedCourse.modules || [])];
    
    const processedModule = {
      ...moduleForm,
      learningObjectives: moduleForm.learningObjectives.split('\n').map(l => l.trim()).filter(l => l !== '')
    };

    if (editingModuleIdx !== null) {
      const isConfirmed = await confirm("Are you sure you want to save the changes to this module?");
      if (!isConfirmed) return;
      modules[editingModuleIdx] = { ...modules[editingModuleIdx], ...processedModule };
    } else {
      modules.push({
        id: `mod-${Date.now()}`,
        ...processedModule,
        lessons: []
      });
    }

    await handleUpdateCourse(selectedCourse.id, { modules });
    setIsAddingModule(false);
  };

  const handleDeleteModule = async (idx: number) => {
    if (!selectedCourse) return;
    const isConfirmed = await confirm("Delete this module and all its contents?");
    if (!isConfirmed) return;
    const modules = [...(selectedCourse.modules || [])];
    modules.splice(idx, 1);
    await handleUpdateCourse(selectedCourse.id, { modules });
  };

  // Material Handlers
  const handleAddMaterial = async () => {
    if (!selectedCourse) return;
    if (!materialForm.title.trim() || !materialForm.url.trim()) {
      await alert("Document title and URL are required.");
      return;
    }
    const materials = [...(selectedCourse.materials || [])];
    materials.push({
      ...materialForm,
      id: `mat-${Date.now()}`
    });
    await handleUpdateCourse(selectedCourse.id, { materials });
    setIsAddingMaterial(false);
    setMaterialForm({ title: '', url: '', type: 'PDF' });
  };

  const handleDeleteMaterial = async (idx: number) => {
    if (!selectedCourse) return;
    const isConfirmed = await confirm("Delete this material?");
    if (!isConfirmed) return;
    const materials = [...(selectedCourse.materials || [])];
    materials.splice(idx, 1);
    await handleUpdateCourse(selectedCourse.id, { materials });
  };

  // Lesson Handlers
  const handleOpenLessonModal = (moduleIdx: number, lessonIdx: number | null = null) => {
    setEditingLessonIdx({ moduleIdx, lessonIdx });
    const module = selectedCourse.modules?.[moduleIdx];
    const lesson = module?.lessons?.[lessonIdx] || module?.topics?.[lessonIdx];

    if (lessonIdx !== null && lesson) {
      setLessonForm({ ...lesson, attachments: lesson.attachments || [] });
    } else {
      setLessonForm({ title: '', type: 'video', duration: '', content: '', videoUrl: '', attachments: [] });
    }
    setAttachmentForm({ title: '', url: '' });
    setIsAddingLesson(true);
  };

  const handleAddAttachment = () => {
    if (!attachmentForm.title.trim() || !attachmentForm.url.trim()) return;
    setLessonForm({
      ...lessonForm,
      attachments: [...lessonForm.attachments, attachmentForm]
    });
    setAttachmentForm({ title: '', url: '' });
  };

  const handleDeleteAttachment = (idx: number) => {
    const updated = [...lessonForm.attachments];
    updated.splice(idx, 1);
    setLessonForm({ ...lessonForm, attachments: updated });
  };

  const handleSaveLesson = async () => {
    if (!selectedCourse) return;
    if (!lessonForm.title.trim()) {
      await alert("Lesson title is required.");
      return;
    }
    const modules = [...(selectedCourse.modules || [])];
    const module = { ...modules[editingLessonIdx.moduleIdx] };
    const lessons = [...(module.lessons || module.topics || [])];

    if (editingLessonIdx.lessonIdx !== null) {
      const isConfirmed = await confirm("Are you sure you want to save the changes to this lesson?");
      if (!isConfirmed) return;
      lessons[editingLessonIdx.lessonIdx] = { ...lessons[editingLessonIdx.lessonIdx], ...lessonForm };
    } else {
      lessons.push({
        id: `les-${Date.now()}`,
        ...lessonForm
      });
    }

    module.lessons = lessons;
    module.topics = undefined;
    modules[editingLessonIdx.moduleIdx] = module;
    await handleUpdateCourse(selectedCourse.id, { modules });
    setIsAddingLesson(false);
  };

  const handleDeleteLesson = async (moduleIdx: number, lessonIdx: number) => {
    if (!selectedCourse) return;
    const isConfirmed = await confirm("Delete this lesson?");
    if (!isConfirmed) return;
    const modules = [...(selectedCourse.modules || [])];
    const module = { ...modules[moduleIdx] };
    const lessons = [...(module.lessons || module.topics || [])];
    lessons.splice(lessonIdx, 1);
    module.lessons = lessons;
    module.topics = undefined;
    modules[moduleIdx] = module;
    await handleUpdateCourse(selectedCourse.id, { modules });
  };

  // Objective Handlers
  // Shared Quill Modules Configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['link', 'blockquote', 'code-block'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['image', 'video', 'table'],
      ['clean']
    ],
    table: true,
    clipboard: {
      matchVisual: false,
    }
  };

  const handleOpenObjectiveModal = (idx: number | null = null) => {
    if (idx !== null && selectedCourse.learningObjectives?.[idx]) {
      setEditingObjectiveIdx(idx);
      setObjectiveText(selectedCourse.learningObjectives[idx]);
    } else {
      setEditingObjectiveIdx(null);
      setObjectiveText('');
    }
    setIsAddingObjective(true);
  };

  const handleSaveObjective = async () => {
    const isCleanEmpty = !objectiveText || objectiveText.replace(/<(.|\n)*?>/g, '').trim().length === 0;
    if (!selectedCourse || isCleanEmpty) return;
    const learningObjectives = [...(selectedCourse.learningObjectives || [])];
    
    if (editingObjectiveIdx !== null) {
      learningObjectives[editingObjectiveIdx] = objectiveText.trim();
    } else {
      learningObjectives.push(objectiveText.trim());
    }
    
    await handleUpdateCourse(selectedCourse.id, { learningObjectives });
    setObjectiveText('');
    setEditingObjectiveIdx(null);
    setIsAddingObjective(false);
  };

  const handleMoveObjective = async (idx: number, direction: 'up' | 'down') => {
    if (!selectedCourse) return;
    const learningObjectives = [...(selectedCourse.learningObjectives || [])];
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    if (newIdx < 0 || newIdx >= learningObjectives.length) return;
    
    const temp = learningObjectives[idx];
    learningObjectives[idx] = learningObjectives[newIdx];
    learningObjectives[newIdx] = temp;
    
    await handleUpdateCourse(selectedCourse.id, { learningObjectives });
  };

  const handleOpenAssessmentModal = (modIdx: number) => {
    const mod = selectedCourse.modules[modIdx];
    setEditingModuleAssessIdx(modIdx);
    if (mod.assessment) {
      setAssessmentForm(mod.assessment);
    } else {
      setAssessmentForm({
        title: `${mod.title} Assessment`,
        description: '',
        type: 'report',
        sections: [
          {
            title: 'Part 1',
            questions: []
          }
        ]
      });
    }
    setIsAddingAssessment(true);
  };

  const handleSaveAssessment = async () => {
    if (editingModuleAssessIdx === null) return;
    
    const modules = [...selectedCourse.modules];
    modules[editingModuleAssessIdx] = {
      ...modules[editingModuleAssessIdx],
      assessment: {
        ...assessmentForm,
        id: assessmentForm.id || `assess-${Date.now()}`
      }
    };
    
    await handleUpdateCourse(selectedCourse.id, { modules });
    setIsAddingAssessment(false);
    setEditingModuleAssessIdx(null);
  };

  const handleOpenQuizModal = (modIdx: number) => {
    const mod = selectedCourse.modules[modIdx];
    setEditingModuleAssessIdx(modIdx);
    setQuizForm(mod.quiz || []);
    setIsAddingQuiz(true);
  };

  const handleSaveQuiz = async () => {
    if (editingModuleAssessIdx === null) return;
    
    const modules = [...selectedCourse.modules];
    modules[editingModuleAssessIdx] = {
      ...modules[editingModuleAssessIdx],
      quiz: quizForm
    };
    
    await handleUpdateCourse(selectedCourse.id, { modules });
    setIsAddingQuiz(false);
    setEditingModuleAssessIdx(null);
  };

  const handleDeleteObjective = async (idx: number) => {
    const isConfirmed = await confirm("Delete this learning objective?");
    if (!isConfirmed) return;
    const learningObjectives = [...(selectedCourse.learningObjectives || [])];
    learningObjectives.splice(idx, 1);
    await handleUpdateCourse(selectedCourse.id, { learningObjectives });
  };

  // Migration helper
  const migrateInitialCourses = async () => {
    const isConfirmed = await confirm("This will upload all initial hardcoded courses to Firestore. Continue?");
    if (!isConfirmed) return;
    setLoading(true);
    try {
      for (const course of initialCourses) {
        // Double check if already exists by id (we'll use the same id as doc id)
        const docRef = doc(db, 'courses', course.id);
        const dataToSave = stripUndefined({ 
          ...course, 
          updatedAt: serverTimestamp() 
        });

        await updateDoc(docRef, dataToSave).catch(async () => {
           // If doesn't exist, set it
           const { id, ...data } = dataToSave;
           await updateDoc(doc(db, 'courses', id), stripUndefined({ 
             ...data, 
             createdAt: serverTimestamp(), 
             updatedAt: serverTimestamp() 
           })).catch(async () => {
             // If still fails because doc doesn't exist, use setDoc
             const { setDoc } = await import('firebase/firestore');
             await setDoc(doc(db, 'courses', id), stripUndefined({ 
               ...data, 
               createdAt: serverTimestamp(), 
               updatedAt: serverTimestamp() 
             }));
           });
        });
      }
      toast("Migration complete!", "success");
    } catch (error) {
      console.error(error);
      await alert("Migration failed.");
    } finally {
      setLoading(false);
    }
  };

  const htmlToDocxElements = (html: string): any[] => {
    if (!html) return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements: any[] = [];

    const processNode = (node: Node, marks: { bold?: boolean; italics?: boolean; strike?: boolean } = {}): TextRun[] => {
        let runs: TextRun[] = [];
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent) {
                runs.push(new TextRun({ text: node.textContent, bold: marks.bold, italics: marks.italics, strike: marks.strike }));
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            switch(el.tagName) {
                case 'STRONG':
                case 'B':
                    Array.from(el.childNodes).forEach(n => runs.push(...processNode(n, { ...marks, bold: true })));
                    break;
                case 'EM':
                case 'I':
                    Array.from(el.childNodes).forEach(n => runs.push(...processNode(n, { ...marks, italics: true })));
                    break;
                case 'S':
                case 'STRIKE':
                    Array.from(el.childNodes).forEach(n => runs.push(...processNode(n, { ...marks, strike: true })));
                    break;
                case 'BR':
                    runs.push(new TextRun({ break: 1 }));
                    break;
                case 'A':
                    Array.from(el.childNodes).forEach(n => runs.push(...processNode(n, marks)));
                    break;
                case 'LI':
                    Array.from(el.childNodes).forEach(n => runs.push(...processNode(n, marks)));
                    break;
                default:
                    Array.from(el.childNodes).forEach(n => runs.push(...processNode(n, marks)));
                    break;
            }
        }
        return runs;
    };

    const blockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'LI', 'BLOCKQUOTE'];

    const processBlock = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) {
                elements.push(new Paragraph({
                    children: [new TextRun({ text })],
                    spacing: { after: 200 }
                }));
            }
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as HTMLElement;

        if (el.tagName === 'UL' || el.tagName === 'OL') {
            Array.from(el.children).forEach(li => {
                const runs = processNode(li);
                if (runs.length > 0) {
                    elements.push(new Paragraph({
                        children: runs,
                        bullet: el.tagName === 'UL' ? { level: 0 } : undefined,
                        numbering: el.tagName === 'OL' ? { reference: 'standard-numbering', level: 0 } : undefined
                    }));
                }
            });
        } else if (blockTags.includes(el.tagName)) {
            const runs = processNode(el);
            if (runs.length > 0) {
                let heading = undefined;
                if (el.tagName === 'H1') heading = HeadingLevel.HEADING_3;
                else if (el.tagName === 'H2') heading = HeadingLevel.HEADING_4;
                else if (el.tagName === 'H3') heading = HeadingLevel.HEADING_5;
                else if (el.tagName === 'H4') heading = HeadingLevel.HEADING_6;

                elements.push(new Paragraph({
                    children: runs,
                    heading: heading,
                    spacing: { after: 200 }
                }));
            } else if (el.tagName === 'P' || el.tagName === 'DIV' || el.tagName === 'BR') {
                 // Even if empty, add some spacing or account for BR
                 elements.push(new Paragraph({ text: "" }));
            }
        } else if (el.tagName === 'TABLE') {
             // Basic table indicator since complex table parsing is hard with just docx Paragraphs
             elements.push(new Paragraph({
                 children: [new TextRun({ text: "[Table Content Omitted - Review in Portal]", italics: true })],
                 spacing: { before: 200, after: 200 }
             }));
        } else {
            // Process children of non-block elements directly
            Array.from(el.childNodes).forEach(child => processBlock(child));
        }
    };

    // Use childNodes instead of children to catch top-level text
    Array.from(doc.body.childNodes).forEach(child => processBlock(child));

    return elements;
  };

  const handleExportDOCX = async () => {
    if (!selectedCourse) return;

    toast("Generating DOCX...", "info");

    try {
        const sections: any[] = [];
        
        // Course Header
        sections.push(new Paragraph({
            text: selectedCourse.title || "Untitled Course",
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 }
        }));

        if (selectedCourse.subtitle) {
            sections.push(new Paragraph({
                text: selectedCourse.subtitle,
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 200 }
            }));
        }

        if (selectedCourse.description) {
            sections.push(new Paragraph({
                text: "Description",
                heading: HeadingLevel.HEADING_3
            }));
            sections.push(new Paragraph({
                text: selectedCourse.description,
                spacing: { after: 400 }
            }));
        }
        
        // Learning Objectives
        if (selectedCourse.learningObjectives && selectedCourse.learningObjectives.length > 0) {
            sections.push(new Paragraph({
                text: "Learning Objectives",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }));
            selectedCourse.learningObjectives.forEach((obj: string) => {
                // Learning objectives are often HTML from Quill too
                const text = obj.replace(/<[^>]*>/g, '').trim();
                sections.push(new Paragraph({
                    text,
                    bullet: { level: 0 }
                }));
            });
        }

        // Modules
        const modules = selectedCourse.modules || [];
        modules.forEach((mod: any, mIdx: number) => {
            sections.push(new Paragraph({
                children: [new TextRun({ text: `Module ${mIdx + 1}: ${mod.title || 'Untitled Module'}`, bold: true })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 800, after: 200 },
                pageBreakBefore: true
            }));

            if (mod.description) {
                sections.push(new Paragraph({
                    children: [new TextRun({ text: mod.description, italics: true })],
                    spacing: { after: 400 }
                }));
            }
            
            // Lessons
            const lessons = mod.lessons || mod.topics || [];
            lessons.forEach((les: any, lIdx: number) => {
                sections.push(new Paragraph({
                    text: `Lesson ${mIdx + 1}.${lIdx + 1}: ${les.title || 'Untitled Lesson'}`,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 100 }
                }));

                const meta = [];
                if (les.type) meta.push(`Type: ${les.type.toUpperCase()}`);
                if (les.duration) meta.push(`Duration: ${les.duration}`);
                
                if (meta.length > 0) {
                    sections.push(new Paragraph({
                        children: [new TextRun({ text: meta.join(' | '), bold: true, size: 18 })],
                        spacing: { after: 200 }
                    }));
                }
                
                if (les.content) {
                    const parsedElements = htmlToDocxElements(les.content);
                    if (parsedElements.length > 0) {
                       sections.push(...parsedElements);
                    }
                } else if (les.description) {
                    sections.push(new Paragraph({
                        text: les.description,
                        spacing: { after: 200 }
                    }));
                }
            });

            // Module Quiz
            if (mod.quiz && mod.quiz.length > 0) {
                sections.push(new Paragraph({
                    text: "Module Quiz (Internal Use - Answers Included)",
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 600, after: 200 }
                }));

                mod.quiz.forEach((q: any, qIdx: number) => {
                    sections.push(new Paragraph({
                        children: [new TextRun({ text: `Question ${qIdx + 1}: ${q.question}`, bold: true })],
                        spacing: { before: 200 }
                    }));

                    (q.options || []).forEach((opt: string, oIdx: number) => {
                        const isCorrect = oIdx === q.correctAnswer;
                        sections.push(new Paragraph({
                            children: [
                                new TextRun({ text: isCorrect ? " [CORRECT] " : " [ ] ", bold: isCorrect, color: isCorrect ? "22c55e" : undefined }),
                                new TextRun({ text: opt, bold: isCorrect })
                            ],
                            bullet: { level: 0 }
                        }));
                    });

                    if (q.explanation) {
                        sections.push(new Paragraph({
                            children: [
                                new TextRun({ text: "Memorandum: ", bold: true }),
                                new TextRun({ text: q.explanation, italics: true })
                            ],
                            spacing: { before: 100 }
                        }));
                    }
                });
            }

            // Module Assessment
            if (mod.assessment) {
                const assess = mod.assessment;
                sections.push(new Paragraph({
                    text: `Module Assessment: ${assess.title || 'Untitled Assessment'}`,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 600, after: 200 }
                }));

                if (assess.description) {
                   sections.push(new Paragraph({
                       text: assess.description,
                       spacing: { after: 200 }
                   }));
                }

                if (assess.type) {
                    sections.push(new Paragraph({
                        children: [new TextRun({ text: `Assessment Type: ${assess.type.toUpperCase()}`, bold: true })],
                        spacing: { after: 200 }
                    }));
                }

                (assess.sections || []).forEach((sec: any) => {
                    sections.push(new Paragraph({
                        text: sec.title || "Section",
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 300, after: 100 }
                    }));

                    (sec.questions || []).forEach((q: any, qIdx: number) => {
                        sections.push(new Paragraph({
                            children: [new TextRun({ text: `Question ${q.label || (qIdx + 1)}: ${q.text || ''}`, bold: true })],
                            spacing: { before: 200 }
                        }));

                        if (q.maxMarks) {
                            sections.push(new Paragraph({
                                children: [new TextRun({ text: `Marks: ${q.maxMarks}`, italics: true, size: 18 })]
                            }));
                        }

                        if (q.modelAnswer) {
                            sections.push(new Paragraph({
                                children: [
                                    new TextRun({ text: "Memorandum: ", bold: true, color: "0284c7" }),
                                    new TextRun({ text: q.modelAnswer })
                                ],
                                spacing: { before: 100 }
                            }));
                        }
                    });
                });
            }
        });

        const docToExport = new Document({
            sections: [{
                properties: {},
                children: sections
            }]
        });

        const blob = await Packer.toBlob(docToExport);
        saveAs(blob, `${selectedCourse.title || 'Course'}.docx`);
        toast("Course exported to DOCX successfully!", "success");
    } catch (error) {
        console.error("Export DOCX Error:", error);
        await alert("Failed to export course to DOCX. Please try again.");
    }
  };

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin h-10 w-10 border-4 border-secondary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 mb-2">Course Management</h1>
          <p className="text-slate-500 text-sm font-medium">Create, edit, and publish learning content.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <button 
            onClick={migrateInitialCourses}
            className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl md:rounded-2xl font-bold transition-all text-[10px] md:text-sm border border-primary/10"
          >
            Migrate Static
          </button>
          {auth.currentUser?.email === 'admin@mojadiacademy.com' && (
            <button 
              onClick={() => setIsImporting(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-secondary/10 text-secondary rounded-xl md:rounded-2xl font-bold hover:bg-secondary/20 transition-all text-[10px] md:text-sm border border-secondary/20"
            >
              <FileUp size={16} className="md:w-5 md:h-5" /> Import Doc
            </button>
          )}
          <button 
            onClick={() => setIsAddingCourse(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 md:px-8 py-3 bg-primary text-white rounded-xl md:rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all text-xs md:text-sm"
          >
            <Plus size={18} className="md:w-5 md:h-5" /> New Course
          </button>
        </div>
      </div>

      {/* Upload Progress Area */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
          <h4 className="text-sm font-bold text-primary flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Uploading Files...
          </h4>
          {Object.entries(uploadProgress).map(([fileKey, progress]) => (
            <div key={fileKey} className="space-y-1">
              <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                <span className="truncate max-w-[250px]">{fileKey.split('_').slice(1).join('_')}</span>
                <div className="flex items-center gap-2">
                  <span>{Math.round(progress)}%</span>
                  <button 
                    onClick={() => {
                      if (uploadTasks.current[fileKey]) {
                        try {
                          uploadTasks.current[fileKey].cancel();
                        } catch (err) {
                          console.error('Failed to cancel task:', err);
                        }
                      }
                      setUploadProgress(prev => {
                        const next = { ...prev };
                        delete next[fileKey];
                        return next;
                      });
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Cancel upload"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course List */}
        <div className={cn("lg:col-span-1 space-y-4", selectedCourse && "hidden lg:block")}>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white rounded-3xl border border-slate-200 focus:border-secondary outline-none shadow-sm transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-3">
            {courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map((course) => (
              <motion.div
                key={course.id}
                layoutId={course.id}
                onClick={() => handleSelectCourse(course)}
                className={cn(
                  "p-4 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden",
                  selectedCourse?.id === course.id 
                    ? "bg-primary text-white border-primary shadow-xl shadow-primary/30" 
                    : "bg-white border-slate-200 hover:border-secondary/50 shadow-sm"
                )}
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                    <img src={course.image || course.thumbnail || undefined} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center justify-between gap-2">
                       <div className="flex gap-1">
                         <span className={cn(
                           "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                           course.status === 'published' 
                             ? (selectedCourse?.id === course.id ? "bg-white/20 text-white" : "bg-green-50 text-green-600")
                             : (selectedCourse?.id === course.id ? "bg-white/10 text-white/60" : "bg-orange-50 text-orange-600")
                         )}>
                           {course.status || 'draft'}
                         </span>
                         {course.isStatic && (
                           <span className={cn(
                             "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-600",
                             selectedCourse?.id === course.id && "bg-white/10 text-white/80"
                           )}>
                             Initial
                           </span>
                         )}
                       </div>
                    </div>
                    <h4 className="font-bold text-sm leading-tight truncate mt-1">{course.title}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <p className={cn(
                        "text-[10px] font-medium",
                        selectedCourse?.id === course.id ? "text-white/60" : "text-slate-400"
                      )}>{course.category}</p>
                      <button 
                        className={cn(
                          "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all",
                          selectedCourse?.id === course.id 
                            ? "bg-white/20 text-white" 
                            : "text-secondary hover:bg-secondary/10"
                        )}
                      >
                         <Edit3 size={10} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detailed View / Editor */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedCourse ? (
              <motion.div
                key={selectedCourse.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden lg:h-[calc(100vh-10rem)] lg:sticky lg:top-32 flex flex-col"
              >
                {/* Editor Header */}
                <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 shrink-0">
                  <div className="flex items-center gap-4 min-w-0">
                     <button 
                       onClick={() => setSelectedCourse(null)}
                       className="lg:hidden p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400 hover:text-primary transition-all shrink-0"
                     >
                       <X size={20} />
                     </button>
                     <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-primary shrink-0">
                        <Layers size={24} />
                     </div>
                     <div className="min-w-0">
                        <h2 className="text-xl font-display font-bold text-slate-900 truncate">{selectedCourse?.title}</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Course Editor</p>
                     </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button 
                      onClick={handleSaveCourseDetails}
                      disabled={isSavingDetails}
                      className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isSavingDetails ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Save size={14} />}
                      Save Details
                    </button>
                    {auth.currentUser?.email === 'admin@mojadiacademy.com' && (
                      <button 
                        onClick={handleExportDOCX}
                        className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold hover:bg-slate-200 transition-all border border-slate-200"
                      >
                        <FileUp size={14} className="rotate-180" /> Export DOCX
                      </button>
                    )}
                    <button 
                      onClick={async () => {
                        const action = selectedCourse.status === 'published' ? 'unpublish' : 'publish';
                        const isConfirmed = await confirm(`Are you sure you want to ${action} this course?`);
                        if (isConfirmed) {
                          handleUpdateCourse(selectedCourse.id, { status: selectedCourse.status === 'published' ? 'draft' : 'published' });
                        }
                      }}
                      className={cn(
                        "px-6 py-2.5 rounded-full text-xs font-bold transition-all border",
                        selectedCourse.status === 'published' 
                          ? "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100" 
                          : "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                      )}
                    >
                      {selectedCourse.status === 'published' ? 'Unpublish' : 'Publish Course'}
                    </button>
                    <button 
                      onClick={() => handleDeleteCourse(selectedCourse.id)}
                      className="p-2.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Editor Tabs or Content */}
                {editorForm && (
                <div className="flex-grow p-4 md:p-8 space-y-8 overflow-y-auto">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Course Title</label>
                        <input 
                          type="text"
                          value={editorForm.title}
                          onChange={(e) => setEditorForm({ ...editorForm, title: e.target.value })}
                          className="w-full px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Subtitle / Summary</label>
                        <input 
                          type="text"
                          value={editorForm.subtitle}
                          onChange={(e) => setEditorForm({ ...editorForm, subtitle: e.target.value })}
                          className="w-full px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-medium"
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Price (ZAR)</label>
                        <input 
                          type="number"
                          value={editorForm.price}
                          onChange={(e) => setEditorForm({ ...editorForm, price: Number(e.target.value) })}
                          className="w-full px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Duration</label>
                        <input 
                          type="text"
                          value={editorForm.duration}
                          onChange={(e) => setEditorForm({ ...editorForm, duration: e.target.value })}
                          className="w-full px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Category</label>
                        <select 
                          value={editorForm.category}
                          onChange={(e) => setEditorForm({ ...editorForm, category: e.target.value })}
                          className="w-full px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold text-sm"
                        >
                          <option>Crop Production</option>
                          <option>Agri-Business</option>
                          <option>Sustainability</option>
                          <option>Hydroponics</option>
                          <option>Livestock</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Level</label>
                        <select 
                          value={editorForm.level}
                          onChange={(e) => setEditorForm({ ...editorForm, level: e.target.value })}
                          className="w-full px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold text-sm"
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Thumbnail URL</label>
                     <input 
                        type="text"
                        value={editorForm.thumbnail || editorForm.image}
                        onChange={(e) => setEditorForm({ ...editorForm, thumbnail: e.target.value, image: e.target.value })}
                        className="w-full px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-medium text-sm"
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Course Description</label>
                     <textarea 
                        value={editorForm.description}
                        onChange={(e) => setEditorForm({ ...editorForm, description: e.target.value })}
                        rows={4}
                        className="w-full px-6 py-4 bg-slate-50 rounded-3xl border border-slate-100 focus:border-secondary outline-none text-sm font-medium leading-relaxed resize-none"
                     />
                   </div>
                   
                   <div className="flex justify-end border-b border-slate-100 pb-8 mt-4">
                     <button 
                       onClick={handleSaveCourseDetails}
                       disabled={isSavingDetails}
                       className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all text-sm disabled:opacity-50"
                     >
                       {isSavingDetails ? 'Saving...' : 'Save Course Details'}
                     </button>
                   </div>

                    {/* Learning Objectives */}
                     <div className="space-y-6">
                       <div className="flex items-center justify-between border-t border-slate-100 pt-8">
                         <div>
                           <h3 className="text-xl font-display font-bold text-slate-900">Learning Objectives</h3>
                           <p className="text-xs text-slate-400 font-medium">Define what students will achieve in this course.</p>
                         </div>
                         <button 
                           onClick={() => handleOpenObjectiveModal()}
                           className="flex items-center gap-2 text-sm font-bold text-secondary hover:underline"
                         >
                           <PlusCircle size={18} /> Add Objective
                         </button>
                       </div>
                       <div className="space-y-3">
                          {(selectedCourse.learningObjectives || []).map((obj: string, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                               <div className="flex items-center gap-4">
                                  <div className="flex flex-col gap-1">
                                     <button 
                                       onClick={() => handleMoveObjective(i, 'up')}
                                       disabled={i === 0}
                                       className="text-slate-300 hover:text-secondary disabled:opacity-0"
                                     >
                                       <ChevronUp size={14} />
                                     </button>
                                     <button 
                                       onClick={() => handleMoveObjective(i, 'down')}
                                       disabled={i === (selectedCourse.learningObjectives?.length || 0) - 1}
                                       className="text-slate-300 hover:text-secondary disabled:opacity-0"
                                     >
                                       <ChevronDown size={14} />
                                     </button>
                                  </div>
                                  <div 
                                    className="text-sm font-medium text-slate-700 prose prose-sm prose-slate max-w-none overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: obj }}
                                  />
                               </div>
                               <div className="flex gap-2">
                                 <button 
                                   onClick={() => handleOpenObjectiveModal(i)}
                                   className="p-1.5 text-slate-300 hover:text-secondary opacity-0 group-hover:opacity-100 transition-all"
                                 >
                                   <Edit3 size={14} />
                                 </button>
                                 <button onClick={() => handleDeleteObjective(i)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                   <Trash2 size={14} />
                                 </button>
                               </div>
                            </div>
                          ))}
                       </div>
                     </div>

                    {/* Modules Management */}
                    <div className="space-y-6 mt-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-8 mt-8">
                        <h3 className="text-xl font-display font-bold text-slate-900">Curriculum Modules</h3>
                      </div>

                      <div className="space-y-4">
                        {(selectedCourse.modules || []).map((module: any, idx: number) => (
                          <div key={module.id || idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="mt-1 text-slate-300 group-hover:text-slate-400 transition-colors">
                                <GripVertical size={20} />
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-slate-900">{module.title}</h5>
                                <p className="text-xs font-medium text-slate-400 mt-1 line-clamp-1">{module.description}</p>
                                {module.learningObjectives && module.learningObjectives.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {module.learningObjectives.map((l: string, i: number) => (
                                      <span key={i} className="text-[9px] px-2 py-0.5 bg-secondary/10 text-secondary rounded-full font-bold">
                                        {l.length > 20 ? l.substring(0, 20) + '...' : l}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleOpenModuleModal(idx)}
                                  className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-secondary hover:shadow-md transition-all"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteModule(idx)}
                                  className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-red-500 hover:shadow-md transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Lessons List within Module */}
                            <div className="ml-9 space-y-2">
                               {(module.lessons && module.lessons.length > 0 ? module.lessons : module.topics || []).map((lesson: any, lIdx: number) => {
                                 if (!lesson) return null;
                                 return (
                                   <div key={lesson.id || `les-${lIdx}`} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 group/lesson">
                                      <div className="flex items-center gap-3">
                                         <div className="text-slate-400">
                                            {lesson.type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                                         </div>
                                         <span className="text-xs font-bold text-slate-700">{lesson.title}</span>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover/lesson:opacity-100 transition-all">
                                        <button onClick={() => handleOpenLessonModal(idx, lIdx)} className="p-1 px-2 text-[10px] font-bold text-secondary hover:bg-secondary/10 rounded-lg">Edit</button>
                                        <button onClick={() => handleDeleteLesson(idx, lIdx)} className="p-1 px-2 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg">Delete</button>
                                      </div>
                                   </div>
                                 );
                               })}
                               <button 
                                 onClick={() => handleOpenLessonModal(idx)}
                                 className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-secondary hover:text-secondary transition-all"
                               >
                                 + Add Lesson
                               </button>
                            </div>

                            {/* Quiz & Assessment Management */}
                            <div className="ml-9 pt-4 border-t border-slate-100/50 flex flex-wrap gap-2">
                              <button 
                                onClick={() => handleOpenQuizModal(idx)}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                  module.quiz && module.quiz.length > 0 
                                    ? "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100" 
                                    : "bg-white text-slate-400 border-slate-200 hover:border-purple-200 hover:text-purple-600"
                                )}
                              >
                                <BookOpen size={14} /> 
                                {module.quiz && module.quiz.length > 0 ? `Edit Quiz (${module.quiz.length})` : 'Add Quiz'}
                              </button>
                              <button 
                                onClick={() => handleOpenAssessmentModal(idx)}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                  module.assessment 
                                    ? "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100" 
                                    : "bg-white text-slate-400 border-slate-200 hover:border-orange-200 hover:text-orange-600"
                                )}
                              >
                                <FileText size={14} /> 
                                {module.assessment ? 'Edit Assessment' : 'Add Assessment'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>

                   {/* Course Materials & Memoranda */}
                   <div className="space-y-6 mt-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-8 mt-8">
                        <div>
                          <h3 className="text-xl font-display font-bold text-slate-900">Answer Guides & Memoranda</h3>
                          <p className="text-xs text-slate-400 font-medium">Attach PDFs or docs as learning resources.</p>
                        </div>
                        <button 
                          onClick={() => setIsAddingMaterial(true)}
                          className="flex items-center gap-2 text-sm font-bold text-secondary hover:underline self-start sm:self-auto"
                        >
                          <FileText size={18} /> Add Document
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {(selectedCourse.materials || []).map((doc: any, i: number) => {
                            if (!doc) return null;
                            return (
                               <div key={doc.id || i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                                     <FileText size={20} />
                                  </div>
                                  <div>
                                     <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                                     <p className="text-[10px] text-slate-400 font-medium">{doc.type || 'PDF Document'}</p>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => handleDeleteMaterial(i)}
                                 className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                               >
                                  <X size={16} />
                                </button>
                             </div>
                           );
                        })}
                      </div>
                   </div>
                </div>
                )}

                <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
                    <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Live editing enabled</p>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => handleOpenModuleModal()}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-secondary text-white rounded-full text-xs font-bold shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                      >
                        <PlusCircle size={14} /> Add Module
                      </button>
                      <button 
                        onClick={() => setIsAddingMaterial(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-50 transition-all"
                      >
                        <FileText size={14} /> Add Material
                      </button>
                    </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border border-slate-200 border-dashed">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                  <BookOpen size={48} />
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">No Course Selected</h3>
                <p className="text-slate-400 font-medium max-w-xs mx-auto">Select a course from the list or create a new one to start editing your academy content.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Course Modal */}
      <AnimatePresence>
        {isAddingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-display font-bold">Create New Course</h2>
                <button onClick={() => setIsAddingCourse(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Title</label>
                  <input 
                    type="text" 
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold"
                    placeholder="e.g. Introduction to Hydroponics"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Subtitle</label>
                  <input 
                    type="text" 
                    value={courseForm.subtitle}
                    onChange={(e) => setCourseForm({...courseForm, subtitle: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-medium"
                    placeholder="Brief highlights..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Category</label>
                      <select 
                         value={courseForm.category}
                         onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold appearance-none"
                      >
                        <option>Crop Production</option>
                        <option>Agri-Business</option>
                        <option>Sustainability</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Price (ZAR)</label>
                      <input 
                        type="number" 
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({...courseForm, price: Number(e.target.value)})}
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold"
                      />
                   </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Thumbnail URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={courseForm.thumbnail || courseForm.image}
                        onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.value, image: e.target.value})}
                        className="flex-1 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-medium text-sm"
                        placeholder="https://images.unsplash.com/... or Upload below"
                      />
                      <label className="px-6 py-4 bg-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-300 transition-all cursor-pointer flex items-center justify-center">
                         Upload
                         <input 
                           type="file" 
                           accept="image/*" 
                           className="hidden" 
                           onChange={async (e) => {
                             if (e.target.files && e.target.files[0]) {
                               const file = e.target.files[0];
                               const target = e.target;
                               try {
                                 const url = await handleFileUpload(file, 'courses/thumbnails'); // Simple upload for thumbnails
                                 setCourseForm({...courseForm, thumbnail: url, image: url});
                               } catch (err) {
                                 console.error(err);
                               } finally {
                                 target.value = '';
                               }
                             }
                           }}
                         />
                      </label>
                    </div>
                  </div>

                  {/* Modal local upload progress */}
                  {Object.keys(uploadProgress).length > 0 && (
                    <div className="mx-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-primary uppercase">Uploading Image...</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-primary">{Math.round(Object.values(uploadProgress)[0])}%</span>
                            <button 
                              onClick={() => {
                                const fileKey = Object.keys(uploadProgress)[0];
                                if (uploadTasks.current[fileKey]) {
                                  try {
                                    uploadTasks.current[fileKey].cancel();
                                  } catch (err) {
                                    console.error('Failed to cancel task:', err);
                                  }
                                }
                                setUploadProgress(prev => {
                                  const next = { ...prev };
                                  delete next[fileKey];
                                  return next;
                                });
                              }}
                              className="text-primary hover:text-secondary p-1"
                              title="Cancel upload"
                            >
                              <X size={12} />
                            </button>
                          </div>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300" 
                            style={{ width: `${Object.values(uploadProgress)[0]}%` }}
                          />
                       </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 shrink-0">
                <button 
                  onClick={() => setIsAddingCourse(false)}
                  className="flex-1 min-w-[120px] py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateCourse}
                  disabled={isUploading || isCreating}
                  className="flex-1 min-w-[200px] py-4 bg-primary disabled:opacity-50 text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all text-sm"
                >
                  {isUploading ? 'Uploading Image...' : isCreating ? 'Creating Course...' : 'Create Course'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Module Modal */}
      <AnimatePresence>
        {isAddingModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-display font-bold">{editingModuleIdx !== null ? 'Edit Module' : 'Add Module'}</h2>
                <button onClick={() => setIsAddingModule(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Module Title</label>
                  <input 
                    type="text" 
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold"
                    placeholder="e.g. Module 1: Soil Health"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Description</label>
                  <textarea 
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-medium resize-none shadow-sm"
                    rows={2}
                    placeholder="Brief overview used in lists..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Introduction</label>
                  <textarea 
                    value={moduleForm.introduction}
                    onChange={(e) => setModuleForm({...moduleForm, introduction: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-medium resize-none shadow-sm"
                    rows={4}
                    placeholder="Detailed entry text for the module..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Module Learning Objectives (One per line)</label>
                  <textarea 
                    value={moduleForm.learningObjectives}
                    onChange={(e) => setModuleForm({...moduleForm, learningObjectives: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-medium resize-none shadow-sm"
                    rows={4}
                    placeholder="Enter objectives, one per line..."
                  />
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 shrink-0">
                <button 
                  onClick={() => setIsAddingModule(false)}
                  className="flex-1 min-w-[120px] py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveModule}
                  className="flex-1 min-w-[150px] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                >
                  {editingModuleIdx !== null ? 'Save Changes' : 'Add Module'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Objective Modal */}
      <AnimatePresence>
        {isAddingObjective && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-display font-bold">{editingObjectiveIdx !== null ? 'Edit Objective' : 'Add Objective'}</h2>
                <button onClick={() => setIsAddingObjective(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Objective Text</label>
                  <div className="quill-transparent">
                    <ReactQuill 
                      theme="snow"
                      value={objectiveText}
                      onChange={setObjectiveText}
                      placeholder="e.g. Master the basics of sustainable farming..."
                      modules={quillModules}
                      className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100"
                    />
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 shrink-0">
                <button onClick={() => setIsAddingObjective(false)} className="flex-1 min-w-[120px] py-4 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-100 transition-all">Cancel</button>
                <button onClick={handleSaveObjective} className="flex-1 min-w-[150px] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  {editingObjectiveIdx !== null ? 'Save Changes' : 'Add Objective'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Lesson Modal */}
      <AnimatePresence>
        {isAddingLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-display font-bold">{editingLessonIdx.lessonIdx !== null ? 'Edit Lesson' : 'Add Lesson'}</h2>
                <button onClick={() => setIsAddingLesson(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Lesson Title</label>
                    <input 
                      type="text" 
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                      className="w-full px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold text-sm"
                      placeholder="e.g. Intro to Soils"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Type</label>
                    <select 
                      value={lessonForm.type}
                      onChange={(e) => setLessonForm({...lessonForm, type: e.target.value as any})}
                      className="w-full px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold text-sm"
                    >
                      <option value="text">Text Lesson</option>
                      <option value="document">Document Lesson</option>
                      <option value="video">Video Lesson</option>
                      <option value="quiz">Quiz</option>
                    </select>
                  </div>
                </div>
                {lessonForm.type === 'video' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Video URL</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        value={lessonForm.videoUrl}
                        onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                        className="flex-1 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-medium text-sm"
                        placeholder="YouTube / Vimeo URL or Upload below"
                      />
                      <label className="px-6 py-3 bg-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-300 transition-all cursor-pointer flex items-center justify-center shrink-0">
                         Upload
                         <input 
                           type="file" 
                           accept="video/*" 
                           className="hidden" 
                           onChange={async (e) => {
                             if (e.target.files && e.target.files[0]) {
                               const file = e.target.files[0];
                               try {
                                 const url = await handleFileUpload(file, 'lessons/videos');
                                 setLessonForm({...lessonForm, videoUrl: url});
                               } catch (err) {}
                             }
                           }}
                         />
                      </label>
                    </div>
                  </div>
                )}
                {lessonForm.type === 'document' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Document URL</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        value={lessonForm.videoUrl}
                        onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                        className="flex-1 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-medium text-sm"
                        placeholder="Google Drive, PDF, or Word Doc URL"
                      />
                      <label className="px-6 py-3 bg-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-300 transition-all cursor-pointer flex items-center justify-center shrink-0">
                         Upload
                         <input 
                           type="file" 
                           accept=".pdf,.doc,.docx" 
                           className="hidden" 
                           onChange={async (e) => {
                             if (e.target.files && e.target.files[0]) {
                               const file = e.target.files[0];
                               try {
                                 const url = await handleFileUpload(file, 'lessons/documents');
                                 setLessonForm({...lessonForm, videoUrl: url});
                               } catch (err) {}
                             }
                           }}
                         />
                      </label>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Duration / Time</label>
                  <input 
                    type="text" 
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})}
                    className="w-full px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold text-sm"
                    placeholder="e.g. 10m"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Lesson Content</label>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    <ReactQuill 
                      theme="snow"
                      value={lessonForm.content} 
                      onChange={(val) => setLessonForm({...lessonForm, content: val})} 
                      modules={quillModules}
                      className="bg-white min-h-[200px]"
                    />
                  </div>
                </div>

                {/* Lesson Attachments */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Supporting Files (Downloads)</label>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      placeholder="File Title" 
                      value={attachmentForm.title}
                      onChange={(e) => setAttachmentForm({...attachmentForm, title: e.target.value})}
                      className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 focus:border-secondary outline-none text-sm font-medium"
                    />
                    <input 
                      type="text" 
                      placeholder="Download URL" 
                      value={attachmentForm.url}
                      onChange={(e) => setAttachmentForm({...attachmentForm, url: e.target.value})}
                      className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 focus:border-secondary outline-none text-sm font-medium"
                    />
                    <div className="flex gap-2">
                      <label className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-300 transition-all cursor-pointer flex items-center justify-center shrink-0">
                        Upload
                        <input 
                          type="file"
                          className="hidden" 
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              try {
                                const url = await handleFileUpload(file, 'lessons/attachments');
                                setAttachmentForm({...attachmentForm, url, title: file.name});
                              } catch (err) {}
                            }
                          }}
                        />
                      </label>
                      <button 
                        onClick={handleAddAttachment}
                        className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {lessonForm.attachments?.map((att, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-700">{att.title}</span>
                           <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{att.url}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteAttachment(i)} 
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 shrink-0">
                <button onClick={() => setIsAddingLesson(false)} className="flex-1 min-w-[120px] py-4 bg-white border border-slate-200 rounded-2xl font-bold transition-all">Cancel</button>
                <button onClick={handleSaveLesson} disabled={isUploading} className="flex-1 min-w-[120px] py-4 bg-primary text-white disabled:opacity-50 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  {editingLessonIdx.lessonIdx !== null ? 'Save Lesson' : 'Add Lesson'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {isAddingQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Module Quiz</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Multiple Choice Questions</p>
                </div>
                <button onClick={() => setIsAddingQuiz(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-all">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-8 space-y-8">
                {/* Add/Edit Question Form */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <h3 className="font-bold text-slate-900">Add New Question</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Text</label>
                       <textarea 
                         value={questionForm.question}
                         onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                         className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 outline-none font-medium text-sm"
                         rows={2}
                       />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {questionForm.options.map((opt: string, i: number) => (
                         <div key={i} className="space-y-1">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Option {i + 1} {i === questionForm.correctAnswer && <span className="text-green-500">(Correct)</span>}</label>
                           <div className="flex gap-2">
                             <input 
                               type="text"
                               value={opt}
                               onChange={(e) => {
                                 const newOpts = [...questionForm.options];
                                 newOpts[i] = e.target.value;
                                 setQuestionForm({...questionForm, options: newOpts});
                               }}
                               className="flex-1 px-4 py-2 bg-white rounded-xl border border-slate-200 outline-none text-sm"
                             />
                             <button 
                               onClick={() => setQuestionForm({...questionForm, correctAnswer: i})}
                               className={cn(
                                 "px-3 rounded-xl border transition-all text-[10px] font-bold uppercase",
                                 questionForm.correctAnswer === i ? "bg-green-500 text-white border-green-500" : "bg-white text-slate-400 border-slate-200 hover:border-green-500"
                               )}
                             >
                               Set Correct
                             </button>
                           </div>
                         </div>
                       ))}
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Explanation (Optional)</label>
                       <input 
                         type="text"
                         value={questionForm.explanation}
                         onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                         className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 outline-none text-sm"
                       />
                    </div>
                    <button 
                      onClick={() => {
                        if (!questionForm.question.trim()) return;
                        setQuizForm([...quizForm, { ...questionForm, id: `q-${Date.now()}` }]);
                        setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' });
                      }}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-all"
                    >
                      Add to Quiz
                    </button>
                  </div>
                </div>

                {/* Existing Questions List */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900">Quiz Content ({quizForm.length})</h3>
                  {quizForm.map((q: any, i: number) => (
                    <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-start gap-4 shadow-sm group">
                       <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 mt-1">{i+1}</div>
                       <div className="flex-grow">
                          <p className="text-sm font-bold text-slate-800">{q.question}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                             {q.options.map((opt: string, oi: number) => (
                               <span key={oi} className={cn("text-[10px] font-medium px-2 py-1 rounded-md", oi === q.correctAnswer ? "bg-green-50 text-green-600 border border-green-100" : "bg-slate-50 text-slate-400")}>
                                 {opt}
                               </span>
                             ))}
                          </div>
                       </div>
                       <button 
                         onClick={() => {
                           const newQuiz = [...quizForm];
                           newQuiz.splice(i, 1);
                           setQuizForm(newQuiz);
                         }}
                         className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
                  {quizForm.length === 0 && <p className="text-center text-sm text-slate-400 italic py-10">No questions added yet.</p>}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={() => setIsAddingQuiz(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all">Cancel</button>
                <button onClick={handleSaveQuiz} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">Save Quiz</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assessment Modal */}
      <AnimatePresence>
        {isAddingAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">Module Assessment</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Written & Scenario Based Tasks</p>
                </div>
                <button onClick={() => setIsAddingAssessment(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assessment Title</label>
                     <input 
                       type="text"
                       value={assessmentForm.title}
                       onChange={(e) => setAssessmentForm({...assessmentForm, title: e.target.value})}
                       className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none font-bold text-sm"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</label>
                     <select 
                       value={assessmentForm.type}
                       onChange={(e) => setAssessmentForm({...assessmentForm, type: e.target.value})}
                       className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none font-bold text-sm"
                     >
                       <option value="report">Written Reflection / Report</option>
                       <option value="scenario">Scenario Analysis</option>
                       <option value="case-study">Case Study</option>
                       <option value="plan">Practical Implementation Plan</option>
                       <option value="calculation">Calculation / Technical</option>
                     </select>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                   <textarea 
                     value={assessmentForm.description}
                     onChange={(e) => setAssessmentForm({...assessmentForm, description: e.target.value})}
                     className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none font-medium text-sm"
                     rows={2}
                   />
                </div>

                {/* Sections List */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <h3 className="font-bold text-slate-900">Assessment Sections</h3>
                     <button 
                       onClick={() => {
                         const newSections = [...assessmentForm.sections];
                         newSections.push({ title: 'New Section', questions: [] });
                         setAssessmentForm({...assessmentForm, sections: newSections});
                       }}
                       className="flex items-center gap-1 text-xs font-bold text-secondary"
                     >
                       <Plus size={14} /> Add Section
                     </button>
                   </div>

                   {assessmentForm.sections.map((section: any, sIdx: number) => (
                     <div key={sIdx} className="p-6 bg-slate-50 rounded-3xl border border-slate-200/50 space-y-4">
                        <div className="flex items-center justify-between">
                           <input 
                             type="text"
                             value={section.title}
                             onChange={(e) => {
                               const newSections = [...assessmentForm.sections];
                               newSections[sIdx] = { ...section, title: e.target.value };
                               setAssessmentForm({...assessmentForm, sections: newSections});
                             }}
                             className="bg-transparent font-bold text-slate-900 border-b border-slate-200 focus:border-secondary outline-none px-1"
                           />
                           <button 
                             onClick={() => {
                               const newSections = [...assessmentForm.sections];
                               newSections.splice(sIdx, 1);
                               setAssessmentForm({...assessmentForm, sections: newSections});
                             }}
                             className="text-red-400 hover:text-red-500"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>

                        {/* Questions in Section */}
                        <div className="space-y-4">
                           {section.questions.map((q: any, qIdx: number) => (
                             <div key={qIdx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-2 group">
                                <div className="flex items-center justify-between">
                                  <input 
                                    type="text"
                                    placeholder="Question Label (e.g. Q1)"
                                    value={q.label}
                                    onChange={(e) => {
                                      const newSections = [...assessmentForm.sections];
                                      const newQuestions = [...section.questions];
                                      newQuestions[qIdx] = { ...q, label: e.target.value };
                                      newSections[sIdx] = { ...section, questions: newQuestions };
                                      setAssessmentForm({...assessmentForm, sections: newSections});
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none w-32"
                                  />
                                  <button 
                                    onClick={() => {
                                      const newSections = [...assessmentForm.sections];
                                      const newQuestions = [...section.questions];
                                      newQuestions.splice(qIdx, 1);
                                      newSections[sIdx] = { ...section, questions: newQuestions };
                                      setAssessmentForm({...assessmentForm, sections: newSections});
                                    }}
                                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                                <textarea 
                                  value={q.text}
                                  placeholder="Question text..."
                                  onChange={(e) => {
                                    const newSections = [...assessmentForm.sections];
                                    const newQuestions = [...section.questions];
                                    newQuestions[qIdx] = { ...q, text: e.target.value };
                                    newSections[sIdx] = { ...section, questions: newQuestions };
                                    setAssessmentForm({...assessmentForm, sections: newSections});
                                  }}
                                  className="w-full text-sm font-medium text-slate-700 outline-none bg-transparent resize-none"
                                  rows={2}
                                />
                                
                                <div className="pt-2 mt-2 border-t border-slate-50 space-y-3">
                                  <div className="flex gap-4">
                                     <div className="flex-1 space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-secondary">Model Answer / Reference Key (Optional)</label>
                                        <textarea 
                                          value={q.modelAnswer || ''}
                                          placeholder="Provide the correct answer or grading key here..."
                                          onChange={(e) => {
                                            const newSections = [...assessmentForm.sections];
                                            const newQuestions = [...section.questions];
                                            newQuestions[qIdx] = { ...q, modelAnswer: e.target.value };
                                            newSections[sIdx] = { ...section, questions: newQuestions };
                                            setAssessmentForm({...assessmentForm, sections: newSections});
                                          }}
                                          className="w-full text-[11px] font-medium text-slate-600 outline-none bg-slate-50 p-2 rounded-lg border border-slate-100 focus:border-secondary transition-all resize-none"
                                          rows={2}
                                        />
                                     </div>
                                     <div className="w-24 space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Max Marks</label>
                                        <input 
                                          type="number"
                                          value={q.maxMarks || ''}
                                          onChange={(e) => {
                                            const newSections = [...assessmentForm.sections];
                                            const newQuestions = [...section.questions];
                                            newQuestions[qIdx] = { ...q, maxMarks: e.target.value };
                                            newSections[sIdx] = { ...section, questions: newQuestions };
                                            setAssessmentForm({...assessmentForm, sections: newSections});
                                          }}
                                          className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 outline-none font-bold text-xs"
                                          placeholder="e.g. 10"
                                        />
                                     </div>
                                  </div>
                                </div>
                             </div>
                           ))}
                           <button 
                             onClick={() => {
                               const newSections = [...assessmentForm.sections];
                               const newQuestions = [...section.questions];
                               newQuestions.push({ label: `Question ${newQuestions.length + 1}`, text: '' });
                               newSections[sIdx] = { ...section, questions: newQuestions };
                               setAssessmentForm({...assessmentForm, sections: newSections});
                             }}
                             className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-secondary hover:text-secondary transition-all"
                           >
                             + Add Question to {section.title}
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={() => setIsAddingAssessment(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all">Cancel</button>
                <button onClick={handleSaveAssessment} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">Save Assessment</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Material Modal */}
      <AnimatePresence>
        {isAddingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-display font-bold">Add Material</h2>
                <button onClick={() => setIsAddingMaterial(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Document Title</label>
                  <input 
                    type="text" 
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold"
                    placeholder="e.g. Assessment Guide"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Document Type</label>
                  <select 
                    value={materialForm.type}
                    onChange={(e) => setMaterialForm({...materialForm, type: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-bold"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="DOC">Word Document</option>
                    <option value="ZIP">Archive (ZIP)</option>
                    <option value="LINK">External Link</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">URL / Source</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={materialForm.url}
                      onChange={(e) => setMaterialForm({...materialForm, url: e.target.value})}
                      className="flex-1 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:border-secondary outline-none font-medium"
                      placeholder="https://docs.google.com/... or Upload below"
                    />
                    <label className="px-6 py-4 bg-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-300 transition-all cursor-pointer flex items-center justify-center">
                       Upload
                       <input 
                         type="file" 
                         className="hidden" 
                         onChange={async (e) => {
                           if (e.target.files && e.target.files[0]) {
                             const file = e.target.files[0];
                             try {
                               const url = await handleFileUpload(file, 'courses/materials');
                               setMaterialForm({...materialForm, url: url});
                             } catch (err) {}
                           }
                         }}
                       />
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setIsAddingMaterial(false)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddMaterial}
                  disabled={isUploading}
                  className="flex-1 py-4 bg-primary disabled:opacity-50 text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                >
                  Add Material
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Importer */}
      {isImporting && auth.currentUser?.email === 'admin@mojadiacademy.com' && (
        <DocumentImporter 
          onClose={() => setIsImporting(false)} 
          onImportComplete={() => setIsImporting(false)} 
        />
      )}
    </div>
  );
};

export default CourseCMS;
