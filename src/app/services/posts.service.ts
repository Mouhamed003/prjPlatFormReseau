import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post, CreatePost, UpdatePost, PostsResponse } from '../models/post.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) {}

  // Créer une nouvelle publication
  createPost(postData: CreatePost): Observable<{ message: string; post: Post }> {
    return this.http.post<{ message: string; post: Post }>(this.apiUrl, postData);
  }

  // Récupérer toutes les publications (feed)
  getAllPosts(limit: number = 10, offset: number = 0): Observable<PostsResponse> {
    const params = `limit=${limit}&offset=${offset}`;
    return this.http.get<PostsResponse>(`${this.apiUrl}?${params}`);
  }

  // Récupérer une publication spécifique
  getPostById(postId: number): Observable<{ post: Post }> {
    return this.http.get<{ post: Post }>(`${this.apiUrl}/${postId}`);
  }

  // Récupérer les publications d'un utilisateur
  getUserPosts(userId: number, limit: number = 10, offset: number = 0): Observable<PostsResponse> {
    const params = `limit=${limit}&offset=${offset}`;
    return this.http.get<PostsResponse>(`${this.apiUrl}/user/${userId}?${params}`);
  }

  // Mettre à jour une publication
  updatePost(postId: number, postData: UpdatePost): Observable<{ message: string; post: Post }> {
    return this.http.put<{ message: string; post: Post }>(`${this.apiUrl}/${postId}`, postData);
  }

  // Supprimer une publication
  deletePost(postId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${postId}`);
  }
}
