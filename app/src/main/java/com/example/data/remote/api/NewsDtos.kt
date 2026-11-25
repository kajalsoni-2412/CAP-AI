
package com.example.data.remote.api

data class NewsFeedResponse(
    val success: Boolean,
    val data: List<NewsArticleDto> = emptyList()
)

data class NewsArticleDto(
    val id: String,
    val title: String,
    val summary: String = "",
    val content: String = "",
    val category: String = "National",
    val source: String = "Press Information Bureau (PIB)",
    val date: String = "",
    val url: String = "",
    val imageUrl: String = "",
    val examRelevance: String = "",
    val keyFacts: List<String> = emptyList(),
    val tags: List<String> = emptyList()
)
