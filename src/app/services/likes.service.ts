import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LikeResponse, LikesResponse, PostLike, CommentLike } from '../models/like.model';
import { PostsResponse } from '../models/post.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LikesService {
  private apiUrl = `${environment.apiUrl}/likes`;

  constructor(private http: HttpClient) {}

  // Ajouter/retirer un like sur une publication
  togglePostLike(postId: number): Observable<LikeResponse> {
    const likeData: PostLike = { postId };
    return this.http.post<LikeResponse>(`${this.apiUrl}/post`, likeData);
  }

  // Ajouter/retirer un like sur un commentaire
  toggleCommentLike(commentId: number): Observable<LikeResponse> {
    const likeData: CommentLike = { commentId };
    return this.http.post<LikeResponse>(`${this.apiUrl}/comment`, likeData);
  }

  // Récupérer les likes d'une publication
  getPostLikes(postId: number, limit: number = 20, offset: number = 0): Observable<LikesResponse> {
    const params = `limit=${limit}&offset=${offset}`;
    return this.http.get<LikesResponse>(`${this.apiUrl}/post/${postId}?${params}`);
  }

  // Récupérer les likes d'un commentaire
  getCommentLikes(commentId: number, limit: number = 20, offset: number = 0): Observable<LikesResponse> {
    const params = `limit=${limit}&offset=${offset}`;
    return this.http.get<LikesResponse>(`${this.apiUrl}/comment/${commentId}?${params}`);
  }

  // Récupérer les publications likées par un utilisateur
  getUserLikedPosts(userId: number, limit: number = 10, offset: number = 0): Observable<PostsResponse> {
    const params = `limit=${limit}&offset=${offset}`;
    return this.http.get<PostsResponse>(`${this.apiUrl}/user/${userId}/posts?${params}`);
  }
}
