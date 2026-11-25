//package com.example.data.model
//
//data class ExamQuestion(
//    val id: String,
//    val question: String,
//    val options: List<String>,
//    val correctIndex: Int,
//    val explanation: String,
//    val difficulty: String, // Easy, Medium, Hard
//    val category: String,
//    val relatedConcept: String,
//    val examType: String = "General"
//)

package com.example.data.model

import java.util.UUID

data class ExamQuestion(
    // Backend-generated revision questions may omit id. Moshi uses this default
    // when decoding a response, so every question still has a stable client-side id.
    val id: String = UUID.randomUUID().toString(),
    val question: String,
    val options: List<String>,
    val correctIndex: Int,
    val explanation: String,
    val difficulty: String, // Easy, Medium, Hard
    val category: String,
    val relatedConcept: String,
    val examType: String = "General"
)
