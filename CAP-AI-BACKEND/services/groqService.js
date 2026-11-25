
const axios = require('axios');
const crypto = require('crypto');
const db = require('../config/store');

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.model = DEFAULT_MODEL;
  }

  getApiKey() {
    return process.env.GROQ_API_KEY || this.apiKey;
  }

  getModel() {
    return process.env.GROQ_MODEL || this.model;
  }

  createHash(value) {
    return crypto
      .createHash('sha256')
      .update(String(value))
      .digest('hex');
  }

  async callGroq(messages, jsonMode = true, retryWithFallback = true) {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is not configured in backend environment variables.'
      );
    }

    const payload = {
      model: this.getModel(),
      messages,
      temperature: 0.3,
      max_tokens: 6000
    };

    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    try {
      const response = await axios.post(
        `${GROQ_BASE_URL}/chat/completions`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Groq returned an empty response.');
      }

      return jsonMode ? this.parseAndCleanJson(content) : content;

    } catch (err) {
      console.error('Groq API Error:', err.response?.data || err.message);

      const status = err.response?.status;

      if (
        retryWithFallback &&
        (status === 429 || status === 404) &&
        payload.model !== FALLBACK_MODEL
      ) {
        console.warn(`Retrying with fallback model: ${FALLBACK_MODEL}`);

        payload.model = FALLBACK_MODEL;

        try {
          const fallbackResponse = await axios.post(
            `${GROQ_BASE_URL}/chat/completions`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 45000
            }
          );

          const content =
            fallbackResponse.data?.choices?.[0]?.message?.content;

          if (!content) {
            throw new Error('Groq fallback model returned an empty response.');
          }

          return jsonMode
            ? this.parseAndCleanJson(content)
            : content;

        } catch (fallbackError) {
          throw this.formatError(fallbackError);
        }
      }

      throw this.formatError(err);
    }
  }

  formatError(err) {
    if (err.response) {
      const status = err.response.status;
      const errorMsg = err.response.data?.error?.message || err.message;

      if (status === 401) {
        return new Error('Invalid Groq API Key. Please verify your credentials.');
      }

      if (status === 429) {
        return new Error('Groq API rate limit reached. Please try again later.');
      }

      if (status === 503 || status === 500) {
        return new Error(
          'Groq AI service is temporarily unavailable. Please retry.'
        );
      }

      return new Error(`Groq API Error (${status}): ${errorMsg}`);
    }

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return new Error(
        'Groq AI request timed out. Please check your network.'
      );
    }

    return err;
  }

  parseAndCleanJson(raw) {
    if (typeof raw === 'object' && raw !== null) {
      return raw;
    }

    if (typeof raw !== 'string' || !raw.trim()) {
      throw new Error('Groq returned invalid JSON content.');
    }

    let clean = raw.trim();

    clean = clean
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '');

    try {
      return JSON.parse(clean);
    } catch {
      throw new Error(
        'Groq returned a response that could not be parsed as JSON.'
      );
    }
  }

  // 1. News analysis
//  async analyzeNews(article) {
//    if (!article || (!article.title && !article.content && !article.description)) {
//      throw new Error('A valid news article is required for analysis.');
//    }
//
//    const articleText = [
//      article.title || '',
//      article.category || '',
//      article.content || article.description || article.summary || ''
//    ].join('\n');
//
//    const contentHash = this.createHash(articleText);
//
//    const cached = await db.analyses.findOne({ contentHash });
//
//    if (cached) {
//      return { ...cached, cached: true };
//    }
//
//    const messages = [
//      {
//        role: 'system',
//        content: `You are an expert current affairs educator for Indian competitive examinations, including UPSC, SSC, Banking, Railway and State PSC exams.
//
//Analyze only the supplied article. Do not invent facts, dates, statistics, policies or government bodies. If information is not available in the article or reliable context, clearly say so.
//
//Return valid JSON only.`
//      },
//      {
//        role: 'user',
//        content: `Analyze this news article.
//
//Title: ${article.title || ''}
//Category: ${article.category || 'General'}
//Content: ${article.content || article.description || article.summary || ''}
//
//Return this JSON structure:
//{
//  "simpleExplanation": "Clear 2-3 sentence explanation of this specific article.",
//  "keyFacts": ["Fact 1", "Fact 2", "Fact 3", "Fact 4"],
//  "examRelevance": "Explain its relevance to competitive examinations.",
//  "keywords": [
//    {"term": "Keyword", "definition": "Definition"}
//  ],
//  "backgroundInfo": "Relevant background information.",
//  "possibleExamQuestions": [
//    "Question 1",
//    "Question 2"
//  ],
//  "quickRevision": "Short revision summary of this specific article."
//}`
//      }
//    ];
//
//    const result = await this.callGroq(messages, true);
//
//    if (!result.simpleExplanation || !Array.isArray(result.keyFacts)) {
//      throw new Error('Groq returned incomplete news analysis. Please retry.');
//    }
//
//    const record = {
//      articleId: article.id || null,
//      contentHash,
//      simpleExplanation: result.simpleExplanation,
//      keyFacts: result.keyFacts,
//      examRelevance: result.examRelevance || '',
//      keywords: Array.isArray(result.keywords) ? result.keywords : [],
//      backgroundInfo: result.backgroundInfo || '',
//      possibleExamQuestions: Array.isArray(result.possibleExamQuestions)
//        ? result.possibleExamQuestions
//        : [],
//      quickRevision: result.quickRevision || ''
//    };
//
//    await db.analyses.create(record);
//
//    return record;
//  }


async analyzeNews(article) {
  if (!article || (!article.title && !article.content && !article.description)) {
    throw new Error('A valid news article is required for analysis.');
  }

  const articleText = [
    article.title || '',
    article.category || '',
    article.content || article.description || article.summary || ''
  ].join('\n');

  const messages = [
    {
      role: 'system',
      content: `You are an expert current affairs educator for Indian competitive examinations.

Analyze the exact article supplied by the user.
Every response must be based on the actual article.
Do not reuse generic explanations.
Do not invent facts, dates, statistics or institutions.
If information is unavailable, explicitly mention that.

Return valid JSON only.`
    },
    {
      role: 'user',
      content: `Analyze this specific news article.

Article ID: ${article.id || 'Not available'}
Title: ${article.title || ''}
Category: ${article.category || ''}
Source: ${article.source || ''}
Published Date: ${article.publishedDate || ''}
Content: ${articleText}

Generate a detailed analysis specifically for this article.

Return JSON:
{
  "simpleExplanation": "Specific explanation of this article",
  "keyFacts": ["Fact 1", "Fact 2", "Fact 3", "Fact 4"],
  "examRelevance": "Specific competitive examination relevance",
  "keywords": [
    {
      "term": "Actual keyword",
      "definition": "Accurate definition"
    }
  ],
  "backgroundInfo": "Relevant background information",
  "possibleExamQuestions": [
    "Question 1",
    "Question 2"
  ],
  "quickRevision": "Article-specific revision summary"
}`
    }
  ];

  const result = await this.callGroq(messages, true);

  if (
    !result.simpleExplanation ||
    !Array.isArray(result.keyFacts) ||
    !Array.isArray(result.keywords) ||
    !Array.isArray(result.possibleExamQuestions)
  ) {
    throw new Error('Groq returned incomplete news analysis.');
  }

  return {
    articleId: article.id || null,
    simpleExplanation: result.simpleExplanation,
    keyFacts: result.keyFacts,
    examRelevance: result.examRelevance || '',
    keywords: result.keywords,
    backgroundInfo: result.backgroundInfo || '',
    possibleExamQuestions: result.possibleExamQuestions,
    quickRevision: result.quickRevision || ''
  };
}


  // 2. Knowledge map
//  async generateKnowledgeMap(topic, contextText = '') {
//    if (!topic || !String(topic).trim()) {
//      throw new Error('A topic is required to generate a knowledge map.');
//    }
//
//    const cacheKey = this.createHash(
//      `${String(topic).trim().toLowerCase()}\n${String(contextText).trim()}`
//    );
//
//    const cached = await db.knowledgeMaps.findOne({ cacheKey });
//
//    if (cached) {
//      return { ...cached, cached: true };
//    }
//
//    const messages = [
//      {
//        role: 'system',
//        content: `You are an educational knowledge-map architect for Indian competitive examinations.
//
//Create a topic-specific knowledge map. Use the supplied context to identify relevant concepts, institutions, laws, schemes, events and facts. Do not use generic unrelated nodes. Do not invent factual relationships.
//
//Return valid JSON only.`
//      },
//      {
//        role: 'user',
//        content: `Create a knowledge map for this topic:
//
//Topic: ${topic}
//Context: ${contextText || 'Create a relevant map for Indian competitive examinations.'}
//
//Return this JSON structure:
//{
//  "mainTopic": "${topic}",
//  "nodes": [
//    {
//      "id": "1",
//      "label": "Main topic",
//      "type": "concept",
//      "description": "Explanation relevant to the topic",
//      "parentId": null
//    },
//    {
//      "id": "2",
//      "label": "Related concept",
//      "type": "concept",
//      "description": "Specific explanation",
//      "parentId": "1"
//    }
//  ],
//  "relationships": [
//    {
//      "fromId": "1",
//      "toId": "2",
//      "label": "Relevant relationship"
//    }
//  ]
//}
//
//Generate meaningful nodes and relationships based on the supplied topic and context.`
//      }
//    ];
//
//    const result = await this.callGroq(messages, true);
//
//    if (!Array.isArray(result.nodes) || result.nodes.length === 0) {
//      throw new Error('Groq returned an invalid knowledge map. Please retry.');
//    }
//
//    const record = {
//      mainTopic: result.mainTopic || topic,
//      cacheKey,
//      nodes: result.nodes,
//      relationships: Array.isArray(result.relationships)
//        ? result.relationships
//        : []
//    };
//
//    await db.knowledgeMaps.create(record);
//
//    return record;
//  }


async generateKnowledgeMap(topic, contextText = '') {
  if (!topic || !String(topic).trim()) {
    throw new Error('A topic is required.');
  }

  const messages = [
    {
      role: 'system',
      content: `You are an expert educational knowledge-map generator.

Generate a unique knowledge map using the exact topic and context.
Never reuse a generic predefined map.
Nodes must represent actual concepts relevant to the supplied topic.
Relationships must be logically meaningful.
Do not invent factual information.

Return valid JSON only.`
    },
    {
      role: 'user',
      content: `Generate a knowledge map for this specific topic.

TOPIC:
${topic}

ARTICLE CONTEXT:
${contextText || 'No article context supplied.'}

Create 8 to 12 meaningful nodes when the available information supports them.
Every node must be relevant to this topic.

Return JSON:
{
  "mainTopic": "${topic.replace(/"/g, '\\"')}",
  "nodes": [
    {
      "id": "1",
      "label": "Main topic",
      "type": "concept",
      "description": "Specific explanation",
      "parentId": null
    }
  ],
  "relationships": [
    {
      "fromId": "1",
      "toId": "2",
      "label": "Specific relationship"
    }
  ]
}`
    }
  ];

  const result = await this.callGroq(messages, true);

  if (!Array.isArray(result.nodes) || result.nodes.length === 0) {
    throw new Error('Groq returned an invalid knowledge map.');
  }

  const ids = new Set(result.nodes.map(node => String(node.id)));

  for (const node of result.nodes) {
    if (!node.id || !node.label || !node.type) {
      throw new Error('Knowledge map contains an invalid node.');
    }
  }

  const relationships = Array.isArray(result.relationships)
    ? result.relationships.filter(edge =>
        ids.has(String(edge.fromId)) &&
        ids.has(String(edge.toId))
      )
    : [];

  return {
    mainTopic: result.mainTopic || topic,
    nodes: result.nodes,
    relationships
  };
}


  // 3. MCQ generation
//  async generateQuestions(
//    articleText,
//    targetExam = 'UPSC',
//    count = 5,
//    difficulty = 'Medium'
//  ) {
//    if (!articleText || !String(articleText).trim()) {
//      throw new Error('Article text is required to generate questions.');
//    }
//
//    const requestedCount = Math.max(
//      1,
//      Math.min(Number(count) || 5, 10)
//    );
//
//    const messages = [
//      {
//        role: 'system',
//        content: `You are an expert question setter for Indian competitive examinations.
//
//Create exam-standard multiple-choice questions based on the supplied text.
//Questions must be relevant to the text and must not repeat one another.
//Each question must have exactly four options and one correct answer.
//Return valid JSON only.`
//      },
//      {
//        role: 'user',
//        content: `Generate exactly ${requestedCount} ${difficulty} difficulty MCQs for ${targetExam} based on this material:
//
//${articleText}
//
//Return this JSON structure:
//{
//  "questions": [
//    {
//      "question": "Question text?",
//      "options": ["Option A", "Option B", "Option C", "Option D"],
//      "correctIndex": 0,
//      "explanation": "Explain the correct answer.",
//      "difficulty": "${difficulty}",
//      "category": "Current Affairs",
//      "relatedConcept": "Related concept"
//    }
//  ]
//}
//
//The questions array must contain exactly ${requestedCount} different questions.`
//      }
//    ];
//
//    let result = await this.callGroq(messages, true);
//    let questions = Array.isArray(result.questions) ? result.questions : [];
//
//    if (questions.length !== requestedCount) {
//      const correctionMessages = [
//        ...messages,
//        {
//          role: 'assistant',
//          content: JSON.stringify(result)
//        },
//        {
//          role: 'user',
//          content: `Your previous response contained ${questions.length} questions. Return a corrected JSON response containing exactly ${requestedCount} questions. Do not omit any requested questions.`
//        }
//      ];
//
//      result = await this.callGroq(correctionMessages, true);
//      questions = Array.isArray(result.questions) ? result.questions : [];
//    }
//
//    if (questions.length !== requestedCount) {
//      throw new Error(
//        `Question generation returned ${questions.length} questions instead of ${requestedCount}. Please retry.`
//      );
//    }
//
//    for (const q of questions) {
//      if (
//        !q.question ||
//        !Array.isArray(q.options) ||
//        q.options.length !== 4 ||
//        !Number.isInteger(q.correctIndex) ||
//        q.correctIndex < 0 ||
//        q.correctIndex > 3
//      ) {
//        throw new Error(
//          'Groq returned an invalid question format. Please retry.'
//        );
//      }
//    }
//
//    const sourceTextHash = this.createHash(articleText);
//
//    for (const q of questions) {
//      await db.generatedQuestions.create({
//        ...q,
//        targetExam,
//        sourceTextHash
//      });
//    }
//
//    return questions;
//  }



async generateQuestions(
  articleText,
  targetExam = 'UPSC',
  count = 5,
  difficulty = 'Medium'
) {
  if (!articleText || !String(articleText).trim()) {
    throw new Error('Article text is required.');
  }

  const requestedCount = Number(count);

  if (
    !Number.isInteger(requestedCount) ||
    requestedCount < 1 ||
    requestedCount > 10
  ) {
    throw new Error('Question count must be between 1 and 10.');
  }

  const messages = [
    {
      role: 'system',
      content: `You are an expert Indian competitive examination question setter.

Generate original, accurate and article-specific MCQs.
Every question must test a different concept or fact.
Each question must have exactly four options and one correct answer.
Never generate generic unrelated questions.
Return valid JSON only.`
    },
    {
      role: 'user',
      content: `Generate EXACTLY ${requestedCount} MCQs.

Target examination: ${targetExam}
Difficulty: ${difficulty}

SOURCE MATERIAL:
${articleText}

Return this JSON structure:
{
  "questions": [
    {
      "question": "Question?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Explanation",
      "difficulty": "${difficulty}",
      "category": "Current Affairs",
      "relatedConcept": "Concept"
    }
  ]
}

IMPORTANT:
- Generate exactly ${requestedCount} questions.
- No duplicate questions.
- Use only the supplied material.
- Return all questions in one response.`
    }
  ];

  let questions = [];

  for (let attempt = 1; attempt <= 3; attempt++) {
    let result;

    if (attempt === 1) {
      result = await this.callGroq(messages, true);
    } else {
      result = await this.callGroq([
        ...messages,
        {
          role: 'assistant',
          content: JSON.stringify({ questions })
        },
        {
          role: 'user',
          content: `Previous attempt was incomplete.

Generate exactly ${requestedCount} valid questions.
Return the complete JSON response, not just the missing questions.`
        }
      ], true);
    }

    questions = Array.isArray(result.questions)
      ? result.questions
      : [];

    const validQuestions = questions.filter(q =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      Number.isInteger(q.correctIndex) &&
      q.correctIndex >= 0 &&
      q.correctIndex <= 3 &&
      q.explanation
    );

    const uniqueQuestions = [
      ...new Map(
        validQuestions.map(q => [
          q.question.trim().toLowerCase(),
          q
        ])
      ).values()
    ];

    questions = uniqueQuestions;

    if (questions.length === requestedCount) {
      break;
    }
  }

  if (questions.length !== requestedCount) {
    throw new Error(
      `Could not generate exactly ${requestedCount} valid questions. Received ${questions.length}.`
    );
  }

  const sourceTextHash = this.createHash(articleText);

  for (const question of questions) {
    await db.generatedQuestions.create({
      ...question,
      targetExam,
      sourceTextHash
    });
  }

  return questions;
}


  // 4. Question explanations
  async explainQuestion(question, options, selectedOption, correctOption) {
    const messages = [
      {
        role: 'system',
        content: 'You are an educational tutor explaining competitive exam questions. Give clear and accurate conceptual explanations.'
      },
      {
        role: 'user',
        content: `Explain this question:

Question: ${question}
Options: ${options.join(' | ')}
Student Selected: ${selectedOption}
Correct Answer: ${correctOption}

Return JSON:
{
  "isCorrect": ${selectedOption === correctOption},
  "pedagogicalExplanation": "Explain the concept clearly.",
  "whyDistractorsAreWrong": ["Explanation 1", "Explanation 2"],
  "memoryTrick": "A useful memory technique."
}`
      }
    ];

    return await this.callGroq(messages, true);
  }

  // 5. Performance analysis
  async analyzePerformance(quizHistory, topicStats = []) {
    const messages = [
      {
        role: 'system',
        content: `You are an AI learning diagnostic engine for competitive exams.
Below 50%: Weak.
50%-69%: Needs Improvement.
70%-84%: Good.
85% or above: Strong.
Return valid JSON only.`
      },
      {
        role: 'user',
        content: `Analyze this preparation data:

Topic Statistics: ${JSON.stringify(topicStats)}
Recent Quiz History: ${JSON.stringify((quizHistory || []).slice(0, 5))}

Return JSON:
{
  "overallVerdict": "Summary of student readiness.",
  "weakTopics": ["Topic 1"],
  "strongTopics": ["Topic 2"],
  "repeatedMistakePatterns": ["Pattern 1"],
  "actionableAdvice": ["Step 1", "Step 2", "Step 3"]
}`
      }
    ];

    return await this.callGroq(messages, true);
  }

  // 6. Personalized revision
  async generateRevision(topic, weakConcepts = [], previousAccuracy = 45) {
    if (!topic || !String(topic).trim()) {
      throw new Error('A revision topic is required.');
    }

    const concepts = Array.isArray(weakConcepts) ? weakConcepts : [];

    const cacheKey = this.createHash(JSON.stringify({
      topic: String(topic).trim().toLowerCase(),
      weakConcepts: concepts,
      previousAccuracy
    }));

    const cached = await db.revisions.findOne({ cacheKey });

    if (cached) {
      return { ...cached, cached: true };
    }

    const conceptsStr = concepts.length
      ? concepts.join(', ')
      : 'Fundamental concepts';

    const messages = [
      {
        role: 'system',
        content: `You are an expert personalized revision coach for Indian competitive examinations.

The student's topic is: ${topic}
Previous accuracy: ${previousAccuracy}%
Weak concepts: ${conceptsStr}

Generate accurate, exam-oriented revision material.

STRICT OUTPUT RULES:
1. Return one valid JSON object only.
2. Do not use Markdown or code fences.
3. Every JSON key and string value must use double quotes.
4. Never leave a string quotation mark unclosed.
5. Use valid JSON numbers and booleans.
6. Do not include comments or trailing commas.
7. Generate exactly 10 different MCQs.
8. Every question must have exactly 4 options.
9. correctIndex must be an integer from 0 to 3.
10. Questions must target the student's weak concepts.
11. Do not invent current affairs statistics or unsupported facts.

Before returning, verify that the complete response is valid JSON and contains exactly 10 questions.`
      },
      {
        role: 'user',
        content: `Create a personalized revision pack.

Topic: ${topic}
Weak concepts: ${conceptsStr}
Previous accuracy: ${previousAccuracy}%

Return exactly this JSON structure:

{
  "topic": "Topic name",
  "explanation": "Detailed but easy-to-understand conceptual revision notes.",
  "keyFacts": [
    "Fact 1",
    "Fact 2",
    "Fact 3",
    "Fact 4"
  ],
  "questions": [
    {
      "question": "Question text?",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctIndex": 0,
      "explanation": "Explain why the correct answer is right."
    }
  ]
}

The questions array must contain exactly 10 unique questions.
Return all 10 questions in the same JSON object.`
      }
    ];

    const result = await this.callGroq(messages, true);

    if (
      !result.explanation ||
      !Array.isArray(result.keyFacts) ||
      !Array.isArray(result.questions)
    ) {
      throw new Error(
        'Groq returned incomplete revision content. Please retry.'
      );
    }

    if (result.questions.length !== 10) {
      throw new Error(
        `Expected 10 revision questions, received ${result.questions.length}.`
      );
    }

    for (const q of result.questions) {
      if (
        !q.question ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        !Number.isInteger(q.correctIndex) ||
        q.correctIndex < 0 ||
        q.correctIndex > 3 ||
        !q.explanation
      ) {
        throw new Error(
          'Groq returned an invalid revision question format. Please retry.'
        );
      }
    }

    const record = {
      topic,
      cacheKey,
      concepts,
      explanation: result.explanation,
      keyFacts: result.keyFacts,
      questions: result.questions,
      previousAccuracy,
      currentAccuracy: 0,
      masteryUpdated: false
    };

    await db.revisions.create(record);

    return record;
  }
}

module.exports = new GroqService();
