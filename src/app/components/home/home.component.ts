import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../../services/posts.service';
import { AuthService } from '../../services/auth.service';
import { LikesService } from '../../services/likes.service';
import { CommentsService } from '../../services/comments.service';
import { Post, CreatePost } from '../../models/post.model';
import { User } from '../../models/user.model';
import { Comment, CreateComment, CommentsResponse } from '../../models/comment.model';
import { LikeResponse } from '../../models/like.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  posts: Post[] = [];
  currentUser: User | null = null;
  isLoading = false;
  errorMessage = '';
  
  // Création de post
  newPostContent = '';
  isCreatingPost = false;
  
  // Commentaires
  showComments: { [postId: number]: boolean } = {};
  postComments: { [postId: number]: Comment[] } = {};
  newCommentContent: { [postId: number]: string } = {};
  isLoadingComments: { [postId: number]: boolean } = {};
  isAddingComment: { [postId: number]: boolean } = {};

  constructor(
    private postsService: PostsService,
    private authService: AuthService,
    private likesService: LikesService,
    private commentsService: CommentsService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.postsService.getAllPosts().subscribe({
      next: (response) => {
        this.posts = response.posts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des posts:', error);
        this.errorMessage = 'Erreur lors du chargement des publications';
        this.isLoading = false;
      }
    });
  }

  createPost(): void {
    if (!this.newPostContent.trim()) return;
    
    this.isCreatingPost = true;
    const postData: CreatePost = {
      content: this.newPostContent.trim()
    };
    
    this.postsService.createPost(postData).subscribe({
      next: (response) => {
        // Ajouter le nouveau post au début de la liste
        this.posts.unshift(response.post);
        this.newPostContent = '';
        this.isCreatingPost = false;
      },
      error: (error) => {
        console.error('Erreur lors de la création du post:', error);
        this.isCreatingPost = false;
      }
    });
  }

  toggleLike(post: Post): void {
    this.likesService.togglePostLike(post.id).subscribe({
      next: (response: LikeResponse) => {
        // Mettre à jour le post dans la liste
        const postIndex = this.posts.findIndex(p => p.id === post.id);
        if (postIndex !== -1) {
          this.posts[postIndex].likesCount = response.likesCount;
          this.posts[postIndex].isLikedByCurrentUser = response.isLiked;
        }
      },
      error: (error: any) => {
        console.error('Erreur lors du toggle like:', error);
      }
    });
  }

  toggleComments(postId: number): void {
    this.showComments[postId] = !this.showComments[postId];
    
    if (this.showComments[postId] && !this.postComments[postId]) {
      this.loadComments(postId);
    }
  }

  loadComments(postId: number): void {
    this.isLoadingComments[postId] = true;
    
    this.commentsService.getCommentsByPost(postId).subscribe({
      next: (response: CommentsResponse) => {
        this.postComments[postId] = response.comments;
        this.isLoadingComments[postId] = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des commentaires:', error);
        this.isLoadingComments[postId] = false;
      }
    });
  }

  addComment(postId: number): void {
    const content = this.newCommentContent[postId];
    if (!content || !content.trim()) return;
    
    this.isAddingComment[postId] = true;
    const commentData: CreateComment = {
      postId: postId,
      content: content.trim()
    };
    
    this.commentsService.createComment(commentData).subscribe({
      next: (response) => {
        // Ajouter le nouveau commentaire à la liste
        if (!this.postComments[postId]) {
          this.postComments[postId] = [];
        }
        this.postComments[postId].push(response.comment);
        
        // Mettre à jour le compteur de commentaires du post
        const postIndex = this.posts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          this.posts[postIndex].commentsCount++;
        }
        
        this.newCommentContent[postId] = '';
        this.isAddingComment[postId] = false;
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout du commentaire:', error);
        this.isAddingComment[postId] = false;
      }
    });
  }

  toggleCommentLike(comment: Comment): void {
    this.likesService.toggleCommentLike(comment.id).subscribe({
      next: (response) => {
        // Mettre à jour le commentaire dans la liste
        Object.keys(this.postComments).forEach(postId => {
          const commentIndex = this.postComments[+postId].findIndex(c => c.id === comment.id);
          if (commentIndex !== -1) {
            this.postComments[+postId][commentIndex].likesCount = response.likesCount;
            this.postComments[+postId][commentIndex].isLikedByCurrentUser = response.isLiked;
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du toggle like commentaire:', error);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  // Méthodes trackBy pour optimiser les performances
  trackByPostId(index: number, post: Post): number {
    return post.id;
  }

  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }
}
