//const groqService = require('../services/groqService');
//const KnowledgeMap = require('../models/KnowledgeMap');
//const Question = require('../models/Question');
//const store = require('../config/store');
//
///**
// * POST /api/ai/analyze-news
// * Matches Android CapApiService: Response<AnalysisResponse>
// */
//exports.analyzeNews = async (req, res) => {
//  try {
//    const article = req.body.article || req.body;
//    if (!article || (!article.title && !article.content && !article.summary)) {
//      return res.status(400).json({
//        success: false,
//        message: 'Valid article object with title or content is required.'
//      });
//    }
//
//    const analysis = await groqService.analyzeNews(article);
//
//    return res.status(200).json({
//      success: true,
//      data: analysis
//    });
//  } catch (error) {
//    console.error('AI analyzeNews error:', error);
//    return res.status(500).json({
//      success: false,
//      message: error.message || 'AI news analysis failed.'
//    });
//  }
//};
//
///**
// * POST /api/ai/knowledge-map
// * Matches Android CapApiService: Response<KnowledgeMapResponse>
// */
//exports.generateKnowledgeMap = async (req, res) => {
//  try {
//    const { topic, contextText } = req.body;
//    if (!topic) {
//      return res.status(400).json({
//        success: false,
//        message: 'Topic string is required for Knowledge Map generation.'
//      });
//    }
//
//    const mapData = await groqService.generateKnowledgeMap(topic, contextText);
//
//    // Save to database/store if user is logged in
//    const userId = req.user?.userId;
//    if (userId) {
//      const mapDoc = {
//        topic,
//        userId,
//        mainTopic: mapData.mainTopic,
//        nodes: mapData.nodes,
//        relationships: mapData.relationships,
//        createdAt: new Date()
//      };
//      if (store.isMongoActive()) {
//        await KnowledgeMap.create(mapDoc);
//      } else {
//        await store.knowledgeMaps.insertOne(mapDoc);
//      }
//    }
//
//    return res.status(200).json({
//      success: true,
//      data: mapData
//    });
//  } catch (error) {
//    console.error('AI knowledge map error:', error);
//    return res.status(500).json({
//      success: false,
//      message: error.message || 'Failed to generate Knowledge Map.'
//    });
//  }
//};
//
///**
// * POST /api/ai/generate-questions
// * Matches Android CapApiService: Response<QuestionsResponse>
// */
////exports.generateQuestions = async (req, res) => {
////  try {
////    const { articleText, targetExam = 'UPSC', count = 5, difficulty = 'Medium' } = req.body;
////    if (!articleText) {
////      return res.status(400).json({
////        success: false,
////        message: 'Article text is required for question generation.'
////      });
////    }
////
////    const questions = await groqService.generateQuestions(
////      articleText,
////      targetExam,
////      Math.min(Number(count) || 5, 10),
////      difficulty
////    );
////
////    return res.status(200).json({
////      success: true,
////      data: questions
////    });
////  } catch (error) {
////    console.error('AI generateQuestions error:', error);
////    return res.status(500).json({
////      success: false,
////      message: error.message || 'Failed to generate questions.'
////    });
////  }
////};
//
//
//exports.generateQuestions = async (req, res) => {
//  try {
//    const {
//      articleText,
//      targetExam = 'UPSC',
//      count = 5,
//      difficulty = 'Medium'
//    } = req.body;
//
//    if (!articleText || !String(articleText).trim()) {
//      return res.status(400).json({
//        success: false,
//        message: 'Article text is required to generate questions.'
//      });
//    }
//
//    const requestedCount = Number(count);
//
//    if (
//      !Number.isInteger(requestedCount) ||
//      requestedCount < 1 ||
//      requestedCount > 10
//    ) {
//      return res.status(400).json({
//        success: false,
//        message: 'Question count must be between 1 and 10.'
//      });
//    }
//
//    const questions = await groqService.generateQuestions(
//      articleText,
//      targetExam,
//      requestedCount,
//      difficulty
//    );
//
//    if (!Array.isArray(questions) || questions.length !== requestedCount) {
//      throw new Error(
//        `Expected ${requestedCount} questions, but received ${questions?.length || 0}.`
//      );
//    }
//
//    return res.status(200).json({
//      success: true,
//      data: questions
//    });
//
//  } catch (error) {
//    console.error('AI generateQuestions error:', error);
//
//    return res.status(500).json({
//      success: false,
//      message: error.message || 'Question generation failed.'
//    });
//  }
//};
//
//
///**
// * POST /api/ai/explain-question
// * Matches Android CapApiService: Response<BaseResponse>
// */
//exports.explainQuestion = async (req, res) => {
//  try {
//    const { question, options, selectedOption, correctOption } = req.body;
//    if (!question || !correctOption) {
//      return res.status(400).json({
//        success: false,
//        message: 'Question and correctOption are required.'
//      });
//    }
//
//    const explanation = await groqService.explainQuestion(
//      question,
//      options || [],
//      selectedOption || 'Not selected',
//      correctOption
//    );
//
//    return res.status(200).json({
//      success: true,
//      message: explanation
//    });
//  } catch (error) {
//    return res.status(500).json({
//      success: false,
//      message: error.message || 'Failed to generate explanation.'
//    });
//  }
//};
//
///**
// * POST /api/ai/revision
// * Matches Android CapApiService: Response<RevisionResponse>
// */
//exports.generateRevision = async (req, res) => {
//  try {
//    const { topic, weakConcepts, previousAccuracy } = req.body;
//    if (!topic) {
//      return res.status(400).json({
//        success: false,
//        message: 'Topic is required for revision generation.'
//      });
//    }
//
//    const revision = await groqService.generateRevision(
//      topic,
//      weakConcepts || [],
//      Number(previousAccuracy) || 45.0
//    );
//
//    return res.status(200).json({
//      success: true,
//      data: revision
//    });
//  } catch (error) {
//    console.error('AI generateRevision error:', error);
//    return res.status(500).json({
//      success: false,
//      message: error.message || 'Failed to generate revision session.'
//    });
//  }
//};


const groqService = require('../services/groqService');
const KnowledgeMap = require('../models/KnowledgeMap');
const store = require('../config/store');

/**
 * POST /api/ai/analyze-news
 */
exports.analyzeNews = async (req, res) => {
  try {
    const article = req.body.article || req.body;

    if (
      !article ||
      (!article.title &&
        !article.content &&
        !article.description &&
        !article.summary)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid article with title or content is required.'
      });
    }

    console.log('AI Analysis requested:', {
      articleId: article.id || null,
      title: article.title || 'Untitled',
      category: article.category || 'General'
    });

    const analysis = await groqService.analyzeNews(article);

    if (!analysis || !analysis.simpleExplanation) {
      throw new Error('AI returned incomplete news analysis.');
    }

    return res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('AI analyzeNews error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'AI news analysis failed.'
    });
  }
};


/**
 * POST /api/ai/knowledge-map
 */
exports.generateKnowledgeMap = async (req, res) => {
  try {
    const {
      topic,
      contextText,
      article
    } = req.body;

    const selectedTopic =
      topic ||
      article?.title ||
      '';

    const selectedContext =
      contextText ||
      article?.content ||
      article?.description ||
      article?.summary ||
      '';

    if (!String(selectedTopic).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required for knowledge map generation.'
      });
    }

    if (!String(selectedContext).trim()) {
      console.warn(
        'Knowledge map requested without article context:',
        selectedTopic
      );
    }

    console.log('Knowledge map requested:', {
      topic: selectedTopic,
      contextLength: String(selectedContext).length
    });

    const mapData = await groqService.generateKnowledgeMap(
      selectedTopic,
      selectedContext
    );

    if (
      !mapData ||
      !Array.isArray(mapData.nodes) ||
      mapData.nodes.length === 0
    ) {
      throw new Error('AI returned an invalid knowledge map.');
    }

    // Save map for authenticated users.
    const userId = req.user?.userId;

    if (userId) {
      const mapDoc = {
        topic: selectedTopic,
        userId,
        mainTopic: mapData.mainTopic,
        nodes: mapData.nodes,
        relationships: mapData.relationships,
        createdAt: new Date()
      };

      if (store.isMongoActive()) {
        await KnowledgeMap.create(mapDoc);
      } else {
        await store.knowledgeMaps.insertOne(mapDoc);
      }
    }

    return res.status(200).json({
      success: true,
      data: mapData
    });

  } catch (error) {
    console.error('AI knowledge map error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Knowledge map generation failed.'
    });
  }
};


/**
 * POST /api/ai/generate-questions
 */
exports.generateQuestions = async (req, res) => {
  try {
    const {
      articleText,
      article,
      targetExam = 'UPSC',
      difficulty = 'Medium'
    } = req.body;

    // Support either plain article text or an article object.
    const sourceText =
      typeof articleText === 'string'
        ? articleText
        : typeof articleText === 'object' && articleText !== null
          ? [
              articleText.title,
              articleText.description,
              articleText.content
            ].filter(Boolean).join('\n')
          : typeof article === 'string'
            ? article
            : article
              ? [
                  article.title,
                  article.description,
                  article.content,
                  article.summary
                ].filter(Boolean).join('\n')
              : '';

    if (!sourceText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Article text is required for question generation.'
      });
    }

    const requestedCount =
      req.body.count === undefined
        ? 5
        : Number(req.body.count);

    if (
      !Number.isInteger(requestedCount) ||
      requestedCount < 1 ||
      requestedCount > 10
    ) {
      return res.status(400).json({
        success: false,
        message: 'Question count must be between 1 and 10.'
      });
    }

    console.log('Question generation requested:', {
      targetExam,
      requestedCount,
      difficulty,
      articleLength: sourceText.length
    });

    const questions = await groqService.generateQuestions(
      sourceText,
      targetExam,
      requestedCount,
      difficulty
    );

    if (
      !Array.isArray(questions) ||
      questions.length !== requestedCount
    ) {
      throw new Error(
        `Expected ${requestedCount} questions but received ${
          questions?.length || 0
        }.`
      );
    }

    return res.status(200).json({
      success: true,
      data: questions
    });

  } catch (error) {
    console.error('AI generateQuestions error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Question generation failed.'
    });
  }
};


/**
 * POST /api/ai/explain-question
 */
exports.explainQuestion = async (req, res) => {
  try {
    const {
      question,
      options,
      selectedOption,
      correctOption
    } = req.body;

    if (!question || !correctOption) {
      return res.status(400).json({
        success: false,
        message: 'Question and correct answer are required.'
      });
    }

    const explanation = await groqService.explainQuestion(
      question,
      Array.isArray(options) ? options : [],
      selectedOption || 'Not selected',
      correctOption
    );

    return res.status(200).json({
      success: true,
      message: explanation
    });

  } catch (error) {
    console.error('AI explainQuestion error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Question explanation failed.'
    });
  }
};


/**
 * POST /api/ai/revision
 */
exports.generateRevision = async (req, res) => {
  try {
    const {
      topic,
      weakConcepts,
      previousAccuracy
    } = req.body;

    if (!topic || !String(topic).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required for revision generation.'
      });
    }

    const accuracy =
      previousAccuracy === undefined ||
      previousAccuracy === null ||
      previousAccuracy === ''
        ? 45
        : Number(previousAccuracy);

    if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) {
      return res.status(400).json({
        success: false,
        message: 'Previous accuracy must be between 0 and 100.'
      });
    }

    const concepts = Array.isArray(weakConcepts)
      ? weakConcepts
      : [];

    console.log('Revision requested:', {
      topic,
      weakConceptCount: concepts.length,
      previousAccuracy: accuracy
    });

    const revision = await groqService.generateRevision(
      topic,
      concepts,
      accuracy
    );

    if (!revision || !Array.isArray(revision.questions)) {
      throw new Error('AI returned incomplete revision content.');
    }

    return res.status(200).json({
      success: true,
      data: revision
    });

  } catch (error) {
    console.error('AI generateRevision error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Revision generation failed.'
    });
  }
};
