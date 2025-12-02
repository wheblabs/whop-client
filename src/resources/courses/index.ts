import type { Whop } from '@/client'
import { WhopAuthError } from '@/lib/errors'
import { graphqlRequest } from '@/lib/graphql'
import type {
	Chapter,
	Course,
	CoursesConnection,
	CreateChapterInput,
	CreateCourseInput,
	CreateLessonInput,
	DeleteChapterInput,
	DeleteCourseInput,
	DeleteLessonInput,
	GetProgressOptions,
	Lesson,
	ListCoursesOptions,
	MarkLessonCompleteInput,
	ProgressConnection,
	StartLessonInput,
	UpdateChapterInput,
	UpdateCourseInput,
	UpdateLessonInput,
} from './types'

// GraphQL Fragments
const COURSE_FRAGMENT = `
  fragment Course on Course {
    id
    title
    description
    tagline
    createdAt
    updatedAt
    coverImage
    certificateAfterCompletionEnabled
    requireCompletingLessonsInOrder
    order
    visibility
    thumbnail {
      optimizedUrl
      sourceUrl
    }
    experience {
      id
      name
    }
  }
`

const CHAPTER_FRAGMENT = `
  fragment Chapter on Chapter {
    id
    title
    order
  }
`

const LESSON_FRAGMENT = `
  fragment Lesson on Lesson {
    id
    title
    order
    content
    visibility
    lessonType
    daysFromCourseStartUntilUnlock
    createdAt
    assessmentCompletionRequirement {
      minimumGradePercent
      minimumQuestionsCorrect
    }
    muxAsset {
      id
      durationSeconds
      playbackId
      signedPlaybackId
      signedVideoPlaybackToken
      signedThumbnailPlaybackToken
      signedStoryboardPlaybackToken
      status
    }
    lessonInteraction {
      completed
    }
    thumbnail {
      optimizedUrl
    }
  }
`

/**
 * Chapters sub-resource for course chapter operations
 */
export class CourseChapters {
	constructor(private readonly client: Whop) {}

	/**
	 * Create a new chapter in a course
	 *
	 * @param input - Chapter creation input
	 * @returns Created chapter
	 *
	 * @example
	 * ```typescript
	 * const chapter = await whop.courses.chapters.create({
	 *   courseId: 'course_xxx',
	 *   title: 'Getting Started'
	 * })
	 * ```
	 */
	async create(input: CreateChapterInput): Promise<Chapter> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation CoreCreateChapter($input: CreateChapterInput!) {
        createCourseChapter(input: $input) {
          ...Chapter
        }
      }
      ${CHAPTER_FRAGMENT}
    `

		interface CreateChapterResponse {
			createCourseChapter: Chapter
		}

		const response = await graphqlRequest<CreateChapterResponse>(
			'CoreCreateChapter',
			{
				query: mutation,
				variables: { input },
				operationName: 'CoreCreateChapter',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createCourseChapter
	}

	/**
	 * Update a chapter
	 *
	 * @param chapterId - Chapter ID
	 * @param input - Update input
	 * @returns Updated chapter
	 *
	 * @example
	 * ```typescript
	 * const chapter = await whop.courses.chapters.update('chapter_xxx', {
	 *   title: 'Updated Title'
	 * })
	 * ```
	 */
	async update(
		chapterId: string,
		input: Omit<UpdateChapterInput, 'id'>,
	): Promise<Chapter> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation CoreUpdateChapter($input: UpdateChapterInput!) {
        updateCourseChapter(input: $input) {
          ...Chapter
        }
      }
      ${CHAPTER_FRAGMENT}
    `

		interface UpdateChapterResponse {
			updateCourseChapter: Chapter
		}

		const response = await graphqlRequest<UpdateChapterResponse>(
			'CoreUpdateChapter',
			{
				query: mutation,
				variables: { input: { ...input, id: chapterId } },
				operationName: 'CoreUpdateChapter',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateCourseChapter
	}

	/**
	 * Delete a chapter
	 *
	 * @param chapterId - Chapter ID
	 * @returns True if deleted
	 *
	 * @example
	 * ```typescript
	 * await whop.courses.chapters.delete('chapter_xxx')
	 * ```
	 */
	async delete(chapterId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation CoreDeleteChapter($input: DeleteChapterInput!) {
        deleteCourseChapter(input: $input)
      }
    `

		interface DeleteChapterResponse {
			deleteCourseChapter: boolean
		}

		const response = await graphqlRequest<DeleteChapterResponse>(
			'CoreDeleteChapter',
			{
				query: mutation,
				variables: { input: { id: chapterId } as DeleteChapterInput },
				operationName: 'CoreDeleteChapter',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.deleteCourseChapter
	}
}

/**
 * Lessons sub-resource for course lesson operations
 */
export class CourseLessons {
	constructor(private readonly client: Whop) {}

	/**
	 * Create a new lesson in a chapter
	 *
	 * @param input - Lesson creation input
	 * @returns Created lesson
	 *
	 * @example
	 * ```typescript
	 * const lesson = await whop.courses.lessons.create({
	 *   chapterId: 'chapter_xxx',
	 *   title: 'Introduction',
	 *   lessonType: 'video'
	 * })
	 * ```
	 */
	async create(input: CreateLessonInput): Promise<Lesson> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation CoreCreateLesson($input: CreateLessonInput!) {
        createCourseLesson(input: $input) {
          ...Lesson
        }
      }
      ${LESSON_FRAGMENT}
    `

		interface CreateLessonResponse {
			createCourseLesson: Lesson
		}

		const response = await graphqlRequest<CreateLessonResponse>(
			'CoreCreateLesson',
			{
				query: mutation,
				variables: { input },
				operationName: 'CoreCreateLesson',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createCourseLesson
	}

	/**
	 * Update a lesson
	 *
	 * @param lessonId - Lesson ID
	 * @param input - Update input
	 * @returns Updated lesson
	 *
	 * @example
	 * ```typescript
	 * const lesson = await whop.courses.lessons.update('lesson_xxx', {
	 *   title: 'Updated Lesson Title',
	 *   content: '# New Content'
	 * })
	 * ```
	 */
	async update(
		lessonId: string,
		input: Omit<UpdateLessonInput, 'id'>,
	): Promise<Lesson> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation CoreUpdateLesson($input: UpdateLessonInput!) {
        updateCourseLesson(input: $input) {
          ...Lesson
          maxAttempts
          assessmentQuestions {
            id
            questionText
            questionType
            correctAnswer
            order
            image {
              id
              filename
              source {
                url
              }
            }
            options {
              id
              optionText
              isCorrect
              order
            }
          }
        }
      }
      ${LESSON_FRAGMENT}
    `

		interface UpdateLessonResponse {
			updateCourseLesson: Lesson
		}

		const response = await graphqlRequest<UpdateLessonResponse>(
			'CoreUpdateLesson',
			{
				query: mutation,
				variables: { input: { ...input, id: lessonId } },
				operationName: 'CoreUpdateLesson',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateCourseLesson
	}

	/**
	 * Delete a lesson
	 *
	 * @param lessonId - Lesson ID
	 * @returns True if deleted
	 *
	 * @example
	 * ```typescript
	 * await whop.courses.lessons.delete('lesson_xxx')
	 * ```
	 */
	async delete(lessonId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation CoreDeleteLesson($input: DeleteLessonInput!) {
        deleteCourseLesson(input: $input)
      }
    `

		interface DeleteLessonResponse {
			deleteCourseLesson: boolean
		}

		const response = await graphqlRequest<DeleteLessonResponse>(
			'CoreDeleteLesson',
			{
				query: mutation,
				variables: { input: { id: lessonId } as DeleteLessonInput },
				operationName: 'CoreDeleteLesson',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.deleteCourseLesson
	}

	/**
	 * Mark a lesson as complete for the authenticated user
	 *
	 * @param lessonId - Lesson ID
	 * @returns True if marked complete
	 *
	 * @example
	 * ```typescript
	 * await whop.courses.lessons.markComplete('lesson_xxx')
	 * ```
	 */
	async markComplete(lessonId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation CoreMarkLessonComplete($input: MarkLessonAsCompletedInput!) {
        markLessonAsCompleted(input: $input)
      }
    `

		interface MarkCompleteResponse {
			markLessonAsCompleted: boolean
		}

		const response = await graphqlRequest<MarkCompleteResponse>(
			'CoreMarkLessonComplete',
			{
				query: mutation,
				variables: { input: { lessonId } as MarkLessonCompleteInput },
				operationName: 'CoreMarkLessonComplete',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.markLessonAsCompleted
	}

	/**
	 * Start a lesson (tracks that user began the lesson)
	 *
	 * @param lessonId - Lesson ID
	 * @returns True if started
	 *
	 * @example
	 * ```typescript
	 * await whop.courses.lessons.start('lesson_xxx')
	 * ```
	 */
	async start(lessonId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation CoreStartCourseLesson($input: StartCourseLessonInput!) {
        startCourseLesson(input: $input)
      }
    `

		interface StartLessonResponse {
			startCourseLesson: boolean
		}

		const response = await graphqlRequest<StartLessonResponse>(
			'CoreStartCourseLesson',
			{
				query: mutation,
				variables: { input: { lessonId } as StartLessonInput },
				operationName: 'CoreStartCourseLesson',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.startCourseLesson
	}
}

/**
 * Progress sub-resource for tracking student progress
 */
export class CourseProgress {
	constructor(private readonly client: Whop) {}

	/**
	 * Get student progress for a lesson
	 *
	 * @param options - Progress query options
	 * @returns Progress connection
	 *
	 * @example
	 * ```typescript
	 * // Get all students' progress for a lesson
	 * const progress = await whop.courses.progress.get({
	 *   lessonId: 'lesson_xxx'
	 * })
	 *
	 * // Get specific user's progress
	 * const userProgress = await whop.courses.progress.get({
	 *   lessonId: 'lesson_xxx',
	 *   userId: 'user_xxx'
	 * })
	 * ```
	 */
	async get(options: GetProgressOptions): Promise<ProgressConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query FetchStudentProgress($userId: ID, $lessonId: ID!) {
        listCourseLessonInteractions(userId: $userId, lessonId: $lessonId) {
          nodes {
            id
            completed
            createdAt
            lesson {
              id
              title
            }
            user {
              id
              username
              name
              profilePicture {
                optimizedUrl
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `

		interface ProgressResponse {
			listCourseLessonInteractions: {
				nodes: ProgressConnection['progress']
				pageInfo: ProgressConnection['pageInfo']
			}
		}

		const response = await graphqlRequest<ProgressResponse>(
			'FetchStudentProgress',
			{
				query,
				variables: {
					lessonId: options.lessonId,
					userId: options.userId || null,
				},
				operationName: 'FetchStudentProgress',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return {
			progress: response.listCourseLessonInteractions.nodes,
			pageInfo: response.listCourseLessonInteractions.pageInfo,
		}
	}
}

/**
 * Courses resource - Manage courses, chapters, and lessons
 *
 * @example
 * ```typescript
 * const whop = new Whop()
 *
 * // List courses
 * const courses = await whop.courses.list({ companyId: 'biz_xxx' })
 *
 * // Create a course
 * const course = await whop.courses.create({
 *   experienceId: 'exp_xxx',
 *   title: 'My Course'
 * })
 *
 * // Create chapters and lessons
 * const chapter = await whop.courses.chapters.create({
 *   courseId: course.id,
 *   title: 'Chapter 1'
 * })
 *
 * const lesson = await whop.courses.lessons.create({
 *   chapterId: chapter.id,
 *   title: 'Lesson 1',
 *   lessonType: 'video'
 * })
 * ```
 */
export class Courses {
	public readonly chapters: CourseChapters
	public readonly lessons: CourseLessons
	public readonly progress: CourseProgress

	constructor(private readonly client: Whop) {
		this.chapters = new CourseChapters(client)
		this.lessons = new CourseLessons(client)
		this.progress = new CourseProgress(client)
	}

	/**
	 * List courses
	 *
	 * @param options - Filtering and pagination options
	 * @returns Paginated courses
	 *
	 * @example
	 * ```typescript
	 * // List all courses for a company
	 * const courses = await whop.courses.list({ companyId: 'biz_xxx' })
	 *
	 * // List courses for a specific experience
	 * const expCourses = await whop.courses.list({ experienceId: 'exp_xxx' })
	 * ```
	 */
	async list(options?: ListCoursesOptions): Promise<CoursesConnection> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const query = `
      query CoreFetchCourses($experienceId: ID, $companyId: ID, $first: Int, $after: String) {
        listCourses(experienceId: $experienceId, companyId: $companyId, first: $first, after: $after) {
          edges {
            cursor
            node {
              ...Course
              chapters {
                ...Chapter
                lessons {
                  ...Lesson
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
      ${COURSE_FRAGMENT}
      ${CHAPTER_FRAGMENT}
      ${LESSON_FRAGMENT}
    `

		interface FetchCoursesResponse {
			listCourses: {
				edges: Array<{ cursor: string; node: Course }>
				pageInfo: { hasNextPage: boolean; endCursor: string | null }
			}
		}

		const response = await graphqlRequest<FetchCoursesResponse>(
			'CoreFetchCourses',
			{
				query,
				variables: {
					experienceId: options?.experienceId || null,
					companyId: options?.companyId || null,
					first: options?.first || 50,
					after: options?.after || null,
				},
				operationName: 'CoreFetchCourses',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return {
			courses: response.listCourses.edges.map((edge) => edge.node),
			pageInfo: response.listCourses.pageInfo,
		}
	}

	/**
	 * Create a new course
	 *
	 * @param input - Course creation input
	 * @returns Created course
	 *
	 * @example
	 * ```typescript
	 * const course = await whop.courses.create({
	 *   experienceId: 'exp_xxx',
	 *   title: 'Learn TypeScript',
	 *   tagline: 'Master TypeScript from scratch',
	 *   visibility: 'visible'
	 * })
	 * ```
	 */
	async create(input: CreateCourseInput): Promise<Course> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation CoreCreateCourse($input: CreateCourseInput!) {
        createCourse(input: $input) {
          id
          title
          tagline
          thumbnail {
            id
            optimizedUrl
            sourceUrl
          }
        }
      }
    `

		interface CreateCourseResponse {
			createCourse: Course
		}

		const response = await graphqlRequest<CreateCourseResponse>(
			'CoreCreateCourse',
			{
				query: mutation,
				variables: { input },
				operationName: 'CoreCreateCourse',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.createCourse
	}

	/**
	 * Update a course
	 *
	 * @param courseId - Course ID
	 * @param input - Update input
	 * @returns Updated course
	 *
	 * @example
	 * ```typescript
	 * const course = await whop.courses.update('course_xxx', {
	 *   title: 'Updated Title',
	 *   visibility: 'hidden'
	 * })
	 * ```
	 */
	async update(
		courseId: string,
		input: Omit<UpdateCourseInput, 'id'>,
	): Promise<Course> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation CoreUpdateCourse($input: UpdateCourseInput!) {
        updateCourse(input: $input) {
          id
          title
          tagline
          thumbnail {
            id
            optimizedUrl
            sourceUrl
          }
          chapters {
            ...Chapter
            lessons {
              ...Lesson
            }
          }
        }
      }
      ${CHAPTER_FRAGMENT}
      ${LESSON_FRAGMENT}
    `

		interface UpdateCourseResponse {
			updateCourse: Course
		}

		const response = await graphqlRequest<UpdateCourseResponse>(
			'CoreUpdateCourse',
			{
				query: mutation,
				variables: { input: { ...input, id: courseId } },
				operationName: 'CoreUpdateCourse',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.updateCourse
	}

	/**
	 * Delete a course
	 *
	 * @param courseId - Course ID
	 * @returns True if deleted
	 *
	 * @example
	 * ```typescript
	 * await whop.courses.delete('course_xxx')
	 * ```
	 */
	async delete(courseId: string): Promise<boolean> {
		const tokens = this.client.getTokens()
		if (!tokens) {
			throw new WhopAuthError(
				'Not authenticated. Call auth.verify() first.',
				'NOT_AUTHENTICATED',
			)
		}

		const mutation = `
      mutation CoreDeleteCourse($input: DeleteCourseInput!) {
        deleteCourse(input: $input)
      }
    `

		interface DeleteCourseResponse {
			deleteCourse: boolean
		}

		const response = await graphqlRequest<DeleteCourseResponse>(
			'CoreDeleteCourse',
			{
				query: mutation,
				variables: { input: { id: courseId } as DeleteCourseInput },
				operationName: 'CoreDeleteCourse',
			},
			tokens,
			(newTokens) => this.client._updateTokens(newTokens),
		)

		return response.deleteCourse
	}
}

export * from './types'
