export type QuestionType =
  | "image_id"
  | "quote_fill"
  | "trivia"
  | "actor_match"
  | "decade"
  | "director"
  | "box_office";

export type RoomStatus = "waiting" | "active" | "paused" | "finished";

export type Difficulty = 1 | 2 | 3;

export interface RoomSettings {
  genres: string[];
  decade_start: number;
  decade_end: number;
  question_count: number;
  time_per_question_ms: number;
  difficulty: "easy" | "mixed" | "hard";
  question_types: QuestionType[];
}

export interface QuestionMetadata {
  /** actor_match: array of {actor_name, character_name, image_url} */
  actors?: Array<{
    actor_name: string;
    character_name: string;
    image_url: string | null;
  }>;
  /** box_office: extra context */
  context?: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          is_anonymous: boolean;
          total_score: number;
          games_played: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at" | "total_score" | "games_played"
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      questions: {
        Row: {
          id: string;
          type: QuestionType;
          difficulty: Difficulty;
          genres: string[];
          decade: number | null;
          prompt: string;
          image_url: string | null;
          correct_answer: string;
          wrong_answers: string[];
          metadata: QuestionMetadata | null;
          source: string;
          tmdb_movie_id: number | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["questions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["questions"]["Row"]>;
      };
      rooms: {
        Row: {
          id: string;
          code: string;
          host_id: string;
          status: RoomStatus;
          settings: RoomSettings;
          current_question_index: number;
          question_ids: string[];
          created_at: string;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["rooms"]["Row"],
          "id" | "created_at" | "current_question_index" | "started_at" | "finished_at"
        >;
        Update: Partial<Database["public"]["Tables"]["rooms"]["Row"]>;
      };
      room_players: {
        Row: {
          room_id: string;
          player_id: string;
          joined_at: string;
          is_host: boolean;
        };
        Insert: Omit<
          Database["public"]["Tables"]["room_players"]["Row"],
          "joined_at"
        >;
        Update: Partial<Database["public"]["Tables"]["room_players"]["Row"]>;
      };
      answers: {
        Row: {
          id: string;
          room_id: string;
          question_id: string;
          player_id: string;
          answer: string;
          is_correct: boolean;
          points: number;
          answered_at: string;
          time_taken_ms: number;
        };
        Insert: Omit<
          Database["public"]["Tables"]["answers"]["Row"],
          "id" | "answered_at"
        >;
        Update: Partial<Database["public"]["Tables"]["answers"]["Row"]>;
      };
      game_results: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          total_score: number;
          rank: number;
          played_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["game_results"]["Row"],
          "id" | "played_at"
        >;
        Update: Partial<Database["public"]["Tables"]["game_results"]["Row"]>;
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      increment_profile_score: {
        Args: { p_player_id: string; p_score: number };
        Returns: void;
      };
    };
    Enums: { [_ in never]: never };
  };
};
