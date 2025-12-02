/**
 * Course thumbnail/image
 */
export interface CourseImage {
	id?: string
	optimizedUrl?: string
	sourceUrl?: string
}

/**
 * Course experience reference
 */
export interface CourseExperience {
	id: string
	name: string
}

/**
 * Assessment completion requirements for lessons
 */
export interface AssessmentCompletionRequirement {
	minimumGradePercent?: number
	minimumQuestionsCorrect?: number
}

/**
 * Mux video asset for lessons
 */
export interface MuxAsset {
	id: string
	durationSeconds?: number
	playbackId?: string
	signedPlaybackId?: string
	signedVideoPlaybackToken?: string
	signedThumbnailPlaybackToken?: string
	signedStoryboardPlaybackToken?: string
	status: string
}

/**
 * Lesson interaction tracking
 */
export interface LessonInteraction {
	completed: boolean
}

/**
 * Assessment question option
 */
export interface AssessmentQuestionOption {
	id: string
	optionText: string
	isCorrect: boolean
	order: number
}

/**
 * Assessment question
 */
export interface AssessmentQuestion {
	id: string
	questionText: string
	questionType: string
	correctAnswer?: string
	order: number
	image?: {
		id: string
		filename: string
		source: { url: string }
	}
	options: AssessmentQuestionOption[]
}

/**
 * Lesson visibility options
 */
export type LessonVisibility = 'visible' | 'hidden' | 'draft'

/**
 * Lesson type options
 */
export type LessonType = 'video' | 'text' | 'assessment' | 'download'

/**
 * Course lesson
 */
export interface Lesson {
	id: string
	title: string
	order: number
	content?: string
	visibility: LessonVisibility
	lessonType: LessonType
	daysFromCourseStartUntilUnlock?: number
	createdAt: string
	assessmentCompletionRequirement?: AssessmentCompletionRequirement
	muxAsset?: MuxAsset
	lessonInteraction?: LessonInteraction
	thumbnail?: { optimizedUrl: string }
	maxAttempts?: number
	assessmentQuestions?: AssessmentQuestion[]
}

/**
 * Course chapter
 */
export interface Chapter {
	id: string
	title: string
	order: number
	lessons?: Lesson[]
}

/**
 * Course visibility options
 */
export type CourseVisibility = 'visible' | 'hidden' | 'draft'

/**
 * Full course object
 */
export interface Course {
	id: string
	title: string
	description?: string
	tagline?: string
	createdAt: string
	updatedAt: string
	coverImage?: string
	certificateAfterCompletionEnabled: boolean
	requireCompletingLessonsInOrder: boolean
	order: number
	visibility: CourseVisibility
	thumbnail?: CourseImage
	experience?: CourseExperience
	chapters?: Chapter[]
}

/**
 * Options for listing courses
 */
export interface ListCoursesOptions {
	/** Experience ID to filter by */
	experienceId?: string
	/** Company ID to filter by */
	companyId?: string
	/** Number of items to fetch */
	first?: number
	/** Cursor for pagination */
	after?: string
}

/**
 * Paginated courses response
 */
export interface CoursesConnection {
	courses: Course[]
	pageInfo: {
		hasNextPage: boolean
		endCursor: string | null
	}
}

/**
 * Input for creating a course
 */
export interface CreateCourseInput {
	/** Experience ID to create the course in */
	experienceId: string
	/** Course title */
	title: string
	/** Short tagline */
	tagline?: string
	/** Full description */
	description?: string
	/** Course visibility */
	visibility?: CourseVisibility
	/** Whether to enable certificates */
	certificateAfterCompletionEnabled?: boolean
	/** Whether lessons must be completed in order */
	requireCompletingLessonsInOrder?: boolean
}

/**
 * Input for updating a course
 */
export interface UpdateCourseInput {
	/** Course ID */
	id: string
	/** Course title */
	title?: string
	/** Short tagline */
	tagline?: string
	/** Full description */
	description?: string
	/** Course visibility */
	visibility?: CourseVisibility
	/** Whether to enable certificates */
	certificateAfterCompletionEnabled?: boolean
	/** Whether lessons must be completed in order */
	requireCompletingLessonsInOrder?: boolean
	/** Order in the experience */
	order?: number
}

/**
 * Input for deleting a course
 */
export interface DeleteCourseInput {
	/** Course ID */
	id: string
}

/**
 * Input for creating a chapter
 */
export interface CreateChapterInput {
	/** Course ID */
	courseId: string
	/** Chapter title */
	title: string
	/** Order in the course */
	order?: number
}

/**
 * Input for updating a chapter
 */
export interface UpdateChapterInput {
	/** Chapter ID */
	id: string
	/** Chapter title */
	title?: string
	/** Order in the course */
	order?: number
}

/**
 * Input for deleting a chapter
 */
export interface DeleteChapterInput {
	/** Chapter ID */
	id: string
}

/**
 * Input for creating a lesson
 */
export interface CreateLessonInput {
	/** Chapter ID */
	chapterId: string
	/** Lesson title */
	title: string
	/** Lesson type */
	lessonType?: LessonType
	/** Lesson content (markdown/HTML) */
	content?: string
	/** Lesson visibility */
	visibility?: LessonVisibility
	/** Order in the chapter */
	order?: number
	/** Days from course start until unlock */
	daysFromCourseStartUntilUnlock?: number
}

/**
 * Input for updating a lesson
 */
export interface UpdateLessonInput {
	/** Lesson ID */
	id: string
	/** Lesson title */
	title?: string
	/** Lesson type */
	lessonType?: LessonType
	/** Lesson content (markdown/HTML) */
	content?: string
	/** Lesson visibility */
	visibility?: LessonVisibility
	/** Order in the chapter */
	order?: number
	/** Days from course start until unlock */
	daysFromCourseStartUntilUnlock?: number
	/** Max assessment attempts */
	maxAttempts?: number
	/** Assessment completion requirements */
	assessmentCompletionRequirement?: AssessmentCompletionRequirement
}

/**
 * Input for deleting a lesson
 */
export interface DeleteLessonInput {
	/** Lesson ID */
	id: string
}

/**
 * Input for marking a lesson as complete
 */
export interface MarkLessonCompleteInput {
	/** Lesson ID */
	lessonId: string
}

/**
 * Input for starting a lesson
 */
export interface StartLessonInput {
	/** Lesson ID */
	lessonId: string
}

/**
 * Student progress entry
 */
export interface StudentProgress {
	id: string
	completed: boolean
	createdAt: string
	lesson: {
		id: string
		title: string
	}
	user: {
		id: string
		username: string
		name?: string
		profilePicture?: { optimizedUrl: string }
	}
}

/**
 * Options for fetching student progress
 */
export interface GetProgressOptions {
	/** User ID to get progress for */
	userId?: string
	/** Lesson ID */
	lessonId: string
}

/**
 * Student progress response
 */
export interface ProgressConnection {
	progress: StudentProgress[]
	pageInfo: {
		hasNextPage: boolean
		hasPreviousPage: boolean
	}
}
