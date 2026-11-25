import { getNotifications } from '../../services/api';
import {
  createNotification,
  readNotifications,
  updateNotification,
  deleteNotification,
  markAllNotificationsRead,
} from '../slices/notificationsSlice';

export {
  createNotification,
  readNotifications,
  updateNotification,
  deleteNotification,
  markAllNotificationsRead,
};

export const fetchNotificationsThunk = () => (dispatch) => {
  const list = getNotifications();
  dispatch(readNotifications(list));
  return list;
};
