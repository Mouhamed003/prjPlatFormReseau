import { User } from './user.model';

export interface Like {
  createdAt: string;
  user: User;
}

export interface LikeResponse {
  message: string;
  isLiked: boolean;
  likesCount: number;
}

export interface LikesResponse {
  likes: Like[];
  totalCount: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface PostLike {
  postId: number;
}

export interface CommentLike {
  commentId: number;
}
