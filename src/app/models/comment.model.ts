import { User } from './user.model';

export interface Comment {
  id: number;
  postId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  isLiked: boolean;
  user: User;
  postContent?: string; // Pour les commentaires dans le profil utilisateur
}

export interface CreateComment {
  postId: number;
  content: string;
}

export interface UpdateComment {
  content: string;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
