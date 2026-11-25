import { createAsyncThunk } from '@reduxjs/toolkit';
import { getNotifications, markNotificationsAsRead } from '../../services/api';
import {
  createNotification,
  readNotifications,
  updateNotification,
  deleteNotification,
  markAllNotificationsRead,
} from '../slices/notificationsSlice';
import { showToastThunk } from './uiActions';

export {
  createNotification,
  readNotifications,
  updateNotification,
  deleteNotification,
  markAllNotificationsRead,
};

export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { dispatch }) => {
    const items = getNotifications();
    dispatch(readNotifications(items));
    return items;
  }
);

export const markAllNotificationsReadThunk = () => (dispatch) => {
  const updated = markNotificationsAsRead();
  dispatch(readNotifications(updated));
  dispatch(showToastThunk('All notifications marked as read.', 'info'));
};
