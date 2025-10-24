class BlogApp {
  constructor() {
      this.posts = [];
      this.currentView = 'home';
      this.currentPostId = null;
      this.editMode = false;
      this.init();
  };

  async init() {
      const storedPosts = localStorage.getItem('blogPosts');
      if (storedPosts) {
          this.posts = JSON.parse(storedPosts);
      } else {
          await this.loadInitialData();
      };
      this.render();
  };

  async loadInitialData() {
      try {
          const response = await fetch('posts.json');
          this.posts = await response.json();
          this.savePosts();
      } catch (error) {
          console.error('Error loading posts:', error);
          this.posts = [];
      };
  };

  savePosts() {
      localStorage.setItem('blogPosts', JSON.stringify(this.posts));
  };

  generateId() {
      return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  formatDate(date) {
      if (!date) {
          const now = new Date();
          return now.toISOString().split('T')[0];
      };
      return date;
  };

  showToast(message) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.remove('hidden');
      setTimeout(() => {
          toast.classList.add('hidden');
      }, 3000);
  };

  showHome() {
      this.currentView = 'home';
      this.currentPostId = null;
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  showPost(postId) {
      this.currentView = 'post';
      this.currentPostId = postId;
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  showNewPostForm() {
      this.currentView = 'form';
      this.editMode = false;
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  showEditPostForm(postId) {
      this.currentView = 'form';
      this.editMode = true;
      this.currentPostId = postId;
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  cancelForm() {
      if (this.editMode && this.currentPostId) {
          this.showPost(this.currentPostId);
      } else {
          this.showHome();
      };
  };

  render() {
      document.getElementById('home-view').classList.add('hidden');
      document.getElementById('post-view').classList.add('hidden');
      document.getElementById('form-view').classList.add('hidden');

      if (this.currentView === 'home') {
          document.getElementById('home-view').classList.remove('hidden');
          this.renderPostsGrid();
      } else if (this.currentView === 'post') {
          document.getElementById('post-view').classList.remove('hidden');
          this.renderPost();
      } else if (this.currentView === 'form') {
          document.getElementById('form-view').classList.remove('hidden');
          this.renderForm();
      };
  };

  renderPostsGrid() {
      const grid = document.getElementById('posts-grid');

      if (this.posts.length === 0) {
          grid.innerHTML = `
              <div style="text-align: center; padding: 64px 32px; font-size: 11px; color: var(--gray);">
                  NO POSTS YET :(<br><br>
                  <span style="font-size: 9px;">Click NEW POST to create your first post</span>
              </div>
          `;
          return;
      };

      const sortedPosts = [...this.posts].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
      );

      grid.innerHTML = sortedPosts.map(post => `
          <div class="post-card" onclick="app.showPost('${post.id}')">
              <h3 class="post-card-title">${this.escapeHtml(post.title)}</h3>
              <div class="post-card-meta">
                  <span>BY ${this.escapeHtml(post.author)}</span>
                  <span>${this.formatDate(post.date)}</span>
              </div>
              <p class="post-card-excerpt">${this.escapeHtml(post.excerpt)}</p>
          </div>
      `).join('');
  };

  renderPost() {
      const post = this.posts.find(p => p.id === this.currentPostId);
      if (!post) {
          this.showHome();
          return;
      };

      const contentDiv = document.getElementById('post-content');
      contentDiv.innerHTML = `
          <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
          <div class="post-meta">
              <span>BY ${this.escapeHtml(post.author)}</span>
              <span>${this.formatDate(post.date)}</span>
          </div>
          <div class="post-body">${this.escapeHtml(post.content)}</div>
      `;

      this.renderComments(post);
  };

  renderComments(post) {
      const commentsList = document.getElementById('comments-list');
      const comments = post.comments || [];

      if (comments.length === 0) {
          commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment :D</p>';
          return;
      };

      commentsList.innerHTML = comments.map(comment => `
          <div class="comment">
              <div class="comment-header">
                  <span class="comment-author">${this.escapeHtml(comment.author)}</span>
                  <span class="comment-date">${this.formatDate(comment.date)}</span>
              </div>
              <p class="comment-text">${this.escapeHtml(comment.text)}</p>
          </div>
      `).join('');
  };

  renderForm() {
      const formTitle = document.getElementById('form-title');
      const postForm = document.getElementById('post-form');

      if (this.editMode) {
          formTitle.textContent = 'EDIT POST';
          const post = this.posts.find(p => p.id === this.currentPostId);
          if (post) {
              document.getElementById('post-id').value = post.id;
              document.getElementById('post-title').value = post.title;
              document.getElementById('post-author').value = post.author;
              document.getElementById('post-excerpt').value = post.excerpt;
              document.getElementById('post-content-input').value = post.content;
          };
      } else {
          formTitle.textContent = 'NEW POST';
          postForm.reset();
      };
  };

  savePost(event) {
      event.preventDefault();

      const postId = document.getElementById('post-id').value;
      const title = document.getElementById('post-title').value.trim();
      const author = document.getElementById('post-author').value.trim();
      const excerpt = document.getElementById('post-excerpt').value.trim();
      const content = document.getElementById('post-content-input').value.trim();

      if (!title || !author || !excerpt || !content) {
          this.showToast('Please fill in all fields');
          return;
      };

      if (this.editMode && postId) {
          const postIndex = this.posts.findIndex(p => p.id === postId);
          if (postIndex !== -1) {
              this.posts[postIndex] = {
                  ...this.posts[postIndex],
                  title,
                  author,
                  excerpt,
                  content
              };
              this.savePosts();
              this.showToast('Post updated successfully!');
              this.showPost(postId);
          };
      } else {
          const newPost = {
              id: this.generateId(),
              title,
              author,
              excerpt,
              content,
              date: this.formatDate(),
              comments: []
          };
          this.posts.push(newPost);
          this.savePosts();
          this.showToast('Post created successfully!');
          this.showPost(newPost.id);
      };
  };

  editCurrentPost() {
      if (this.currentPostId) {
          this.showEditPostForm(this.currentPostId);
      };
  };

  deleteCurrentPost() {
      if (!this.currentPostId) return;

      if (confirm('Are you sure you want to delete this post?')) {
          this.posts = this.posts.filter(p => p.id !== this.currentPostId);
          this.savePosts();
          this.showToast('Post deleted successfully!');
          this.showHome();
      };
  };

  addComment() {
      const author = document.getElementById('comment-author').value.trim();
      const text = document.getElementById('comment-text').value.trim();

      if (!author || !text) {
          this.showToast('Please fill in all comment fields');
          return;
      };

      const post = this.posts.find(p => p.id === this.currentPostId);
      if (!post) return;

      if (!post.comments) {
          post.comments = [];
      };

      const newComment = {
          id: this.generateId(),
          author,
          text,
          date: this.formatDate()
      };

      post.comments.push(newComment);
      this.savePosts();

      document.getElementById('comment-author').value = '';
      document.getElementById('comment-text').value = '';

      this.renderComments(post);
      this.showToast('Comment added successfully!');
  };

  escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
  };
};

const app = new BlogApp();