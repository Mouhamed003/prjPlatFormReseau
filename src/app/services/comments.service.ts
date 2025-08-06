import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, CreateComment, UpdateComment, CommentsResponse } from '../models/comment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  // Créer un nouveau commentaire
  createComment(commentData: CreateComment): Observable<{ message: string; comment: Comment }> {
    return this.http.post<{ message: string; comment: Comment }>(this.apiUrl, commentData);
  }

  // Récupérer les commentaires d'une publication
  getPostComments(postId: number, limit: number = 20, offset: number = 0): Observable<CommentsResponse> {
    const params = `limit=${limit}&offset=${offset}`;
    return this.http.get<CommentsResponse>(`${this.apiUrl}/post/${postId}?${params}`);
  }

  // Récupérer un commentaire spécifique
  getCommentById(commentId: number): Observable<{ comment: Comment }> {
    return this.http.get<{ comment: Comment }>(`${this.apiUrl}/${commentId}`);
  }

  // Récupérer les commentaires d'un utilisateur
  getUserComments(userId: number, limit: number = 10, offset: number = 0): Observable<CommentsResponse> {
    const params = `limit=${limit}&offset=${offset}`;
    return this.http.get<CommentsResponse>(`${this.apiUrl}/user/${userId}?${params}`);
  }

  // Mettre à jour un commentaire
  updateComment(commentId: number, commentData: UpdateComment): Observable<{ message: string; comment: Comment }> {
    return this.http.put<{ message: string; comment: Comment }>(`${this.apiUrl}/${commentId}`, commentData);
  }

  // Supprimer un commentaire
  deleteComment(commentId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${commentId}`);
  }
}
