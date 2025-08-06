import { User } from './user.model';

export interface Post {
  id: number;
  content: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isLikedByCurrentUser: boolean;
  user: User;
}

export interface CreatePost {
  content: string;
  imageUrl?: string;
}

export interface UpdatePost {
  content: string;
  imageUrl?: string;
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
