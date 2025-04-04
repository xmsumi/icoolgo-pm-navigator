'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Image from 'next/image';

interface CustomNavigationProps {
  iconStyle: 'large' | 'small' | 'card';
}

const PRESET_COLORS = [
  { name: '蓝色', value: '#1890ff' },
  { name: '绿色', value: '#52c41a' },
  { name: '红色', value: '#f5222d' },
  { name: '橙色', value: '#fa8c16' },
  { name: '紫色', value: '#722ed1' },
  { name: '青色', value: '#13c2c2' },
  { name: '粉色', value: '#eb2f96' }
];

interface Favorite {
  name: string;
  url: string;
  icon?: string;
  iconStyle?: 'api' | 'text' | 'large' | 'small' | 'card';
  iconColor?: string;
}

// 创建一个全局事件总线
const eventBus = {
  listeners: {} as Record<string, Function[]>,
  
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  
  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
};

// 导出全局添加收藏方法
export const addToFavorites = (name: string, url: string, icon?: string) => {
  eventBus.emit('addFavorite', { name, url, icon });
};

export function CustomNavigation({ iconStyle }: CustomNavigationProps) {
  const [favorites, setFavorites] = useState<Favorite[]>(() => {
    try {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  });
  const [newFavorite, setNewFavorite] = useState<Favorite>({ 
    name: '', 
    url: '', 
    iconStyle: 'api',
    iconColor: '#1890ff'
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const [showUrlSuggestions, setShowUrlSuggestions] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');

  // 监听全局添加收藏事件
  useEffect(() => {
    const handleAddFavorite = (data: { name: string; url: string; icon?: string }) => {
      addFavoriteFromExternal(data.name, data.url, data.icon);
    };

    eventBus.on('addFavorite', handleAddFavorite);

    return () => {
      // 清理事件监听
      if (eventBus.listeners['addFavorite']) {
        eventBus.listeners['addFavorite'] = eventBus.listeners['addFavorite'].filter(
          callback => callback !== handleAddFavorite
        );
      }
    };
  }, []);

  // 选择协议
  const selectProtocol = (protocol: string) => {
    const url = `${protocol}${urlInputValue}`;
    setNewFavorite(prev => ({ ...prev, url }));
    setUrlInputValue(url); // 更新输入框的值
    setShowUrlSuggestions(false);
  };

  // 处理URL输入变化
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrlInputValue(value);
    
    // 如果输入为空，隐藏建议
    if (!value) {
      setShowUrlSuggestions(false);
      setNewFavorite(prev => ({ ...prev, url: '' }));
      return;
    }

    // 如果输入已经包含协议，隐藏建议
    if (value.startsWith('http://') || value.startsWith('https://')) {
      setShowUrlSuggestions(false);
      setNewFavorite(prev => ({ ...prev, url: value }));
      return;
    }

    // 显示建议
    setShowUrlSuggestions(true);
  };

  // 点击外部时隐藏建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.url-input-container')) {
        setShowUrlSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const addFavoriteFromExternal = (name: string, url: string, icon?: string) => {
    if (!name || !url) {
      toast.error('名称和URL不能为空');
      return;
    }

    if (!validateUrl(url)) {
      toast.error('请输入有效的URL');
      return;
    }

    // 检查是否已存在
    if (favorites.some(fav => fav.url === url)) {
      toast.error('该网站已在收藏列表中');
      return;
    }

    const newFavoriteItem: Favorite = {
      name,
      url,
      icon,
      iconStyle: 'api',
      iconColor: '#1890ff'
    };

    // 使用函数式更新确保获取最新的状态
    setFavorites(prevFavorites => {
      const updatedFavorites = [...prevFavorites, newFavoriteItem];
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      return updatedFavorites;
    });
  };

  const addFavorite = () => {
    if (!newFavorite.name.trim()) {
      setError('请输入名称');
      return;
    }

    if (!newFavorite.url.trim()) {
      setError('请输入URL');
      return;
    }

    if (!validateUrl(newFavorite.url)) {
      setError('请输入有效的URL');
      return;
    }

    if (favorites.some(f => f.url === newFavorite.url)) {
      setError('该网站已在收藏中');
      return;
    }

    setError('');
    const updatedFavorites = [...favorites, newFavorite];
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    setNewFavorite({ name: '', url: '', iconStyle: 'api', iconColor: '#1890ff' });
    setIsDialogOpen(false);
    toast.success('添加收藏成功');
  };

  const removeFavorite = (index: number) => {
    const newFavorites = favorites.filter((_, i) => i !== index);
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const getFaviconUrl = (url: string): string => {
    try {
      const hostname = new URL(url).hostname;
      return `https://api.qqsuu.cn/api/dm-get?url=${hostname}`;
    } catch {
      return '/default-favicon.png';
    }
  };

  const getIconContent = (favorite: Favorite) => {
    // 设置默认值
    const iconStyle = favorite.iconStyle || 'api';
    const iconColor = favorite.iconColor || '#1890ff';
    const displaySize = iconStyle === 'large' ? 'w-12 h-12' : iconStyle === 'small' ? 'w-6 h-6' : 'w-8 h-8';

    if (iconStyle === 'text') {
      return (
        <div 
          className={`flex items-center justify-center rounded-full ${displaySize}`}
          style={{ backgroundColor: iconColor }}
        >
          <span className="text-white font-semibold">
            {favorite.name.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }
    
    return (
      <div className={`relative ${displaySize}`}>
        {favorite.icon ? (
          <Image
            src={`/${favorite.icon}`}
            alt={favorite.name}
            fill
            className="object-contain rounded-md"
            sizes={iconStyle === 'large' ? '64px' : iconStyle === 'small' ? '32px' : '48px'}
            priority
          />
        ) : (
          <img
            src={getFaviconUrl(favorite.url)}
            alt={favorite.name}
            className={`${displaySize} object-contain rounded-md`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const textIcon = document.createElement('div');
                textIcon.className = `flex items-center justify-center rounded-full ${displaySize}`;
                textIcon.style.backgroundColor = iconColor;
                textIcon.innerHTML = `<span class="text-white font-semibold">${favorite.name.charAt(0).toUpperCase()}</span>`;
                parent.appendChild(textIcon);
              }
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>我的收藏</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 text-[var(--text-color)] hover:text-[var(--primary-color)] shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              添加收藏
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-none shadow-xl">
            <DialogHeader className="space-y-2 pb-4">
              <DialogTitle className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>添加收藏</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="请输入网站名称"
                  value={newFavorite.name}
                  onChange={(e) => setNewFavorite({ ...newFavorite, name: e.target.value })}
                  className="bg-[var(--bg-light)] border border-gray-300 focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-opacity-20"
                />
              </div>
              <div className="space-y-2">
                <div className="relative url-input-container">
                  <Input
                    placeholder="请输入网站地址"
                    value={urlInputValue}
                    onChange={handleUrlChange}
                    className="bg-[var(--bg-light)] border border-gray-300 focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-opacity-20"
                  />
                  {showUrlSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-10">
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => selectProtocol('https://')}
                      >
                        <span className="text-gray-500">https://</span>
                        <span>{urlInputValue}</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => selectProtocol('http://')}
                      >
                        <span className="text-gray-500">http://</span>
                        <span>{urlInputValue}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4 bg-[var(--bg-light)] p-2 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="radio"
                    checked={newFavorite.iconStyle === 'api'}
                    onChange={() => setNewFavorite({ ...newFavorite, iconStyle: 'api' })}
                    className="text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                  />
                  <span>API 图标</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="radio"
                    checked={newFavorite.iconStyle === 'text'}
                    onChange={() => setNewFavorite({ ...newFavorite, iconStyle: 'text' })}
                    className="text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                  />
                  <span>文字图标</span>
                </label>
              </div>
              {newFavorite.iconStyle === 'text' && (
                <div className="space-y-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
                          newFavorite.iconColor === color.value ? 'ring-2 ring-[var(--primary-color)] ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color.value, width: '32px' }} // 设置宽度以保持一致
                        onClick={() => setNewFavorite({ ...newFavorite, iconColor: color.value })}
                        title={color.name}
                      >
                        {newFavorite.iconColor === color.value && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                      <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: newFavorite.iconColor }}
                        >
                          {newFavorite.name ? newFavorite.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>自定义颜色</span>
                        <input
                          type="color"
                          value={newFavorite.iconColor}
                          onChange={(e) => setNewFavorite({ ...newFavorite, iconColor: e.target.value })}
                          className="w-8 h-8 p-0 rounded-full cursor-pointer hover:scale-105 transition-transform"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>
              )}
              <Button 
                onClick={addFavorite} 
                className="w-full hover:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
              >
                添加收藏
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {favorites.map((favorite, index) => (
          <Card key={index} className={`relative group hover:shadow-md transition-shadow ${iconStyle === 'card' ? 'p-4' : 'p-2'}`}>
            <a
              href={favorite.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center ${iconStyle === 'card' ? 'flex-col' : 'gap-2'}`}
              style={{ color: 'var(--text-color)' }}
            >
              <div className={`${iconStyle === 'card' ? 'mb-2' : ''}`}>
                {getIconContent(favorite)}
              </div>
              <span className={`text-sm ${iconStyle === 'card' ? 'text-center' : ''}`}>
                {favorite.name}
              </span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-light)] hover:text-[var(--primary-color)]"
              onClick={() => removeFavorite(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
} 