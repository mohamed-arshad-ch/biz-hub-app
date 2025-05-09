import React, { useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const { height } = Dimensions.get('window');

export interface BottomSheetSelectorRef {
  open: () => void;
  close: () => void;
}

interface BottomSheetSelectorProps {
  children: React.ReactNode;
  height?: number | string;
}

const BottomSheetSelector = forwardRef<BottomSheetSelectorRef, BottomSheetSelectorProps>(
  ({ children, height: sheetHeight = height * 0.7 }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const slideAnim = React.useRef(new Animated.Value(0)).current;

    const open = useCallback(() => {
      setVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [slideAnim]);

    const close = useCallback(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }, [slideAnim]);

    useImperativeHandle(ref, () => ({
      open,
      close,
    }));

    if (!visible) return null;

    return (
      <Modal transparent visible={visible} animationType="none">
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <TouchableWithoutFeedback onPress={close}>
            <Animated.View
              style={[
                styles.backdrop,
                {
                  opacity: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                  }),
                },
              ]}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.sheetContainer,
              {
                height: typeof sheetHeight === 'number' ? sheetHeight : '70%',
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        typeof sheetHeight === 'number' ? sheetHeight : height * 0.7,
                        0,
                      ],
                    }),
                  },
                ],
              },
            ]}
          >
            <SafeAreaView style={styles.contentContainer}>
              {children}
            </SafeAreaView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  contentContainer: {
    flex: 1,
  },
});

export default BottomSheetSelector; 