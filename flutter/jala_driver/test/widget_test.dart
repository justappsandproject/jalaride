import 'package:flutter_test/flutter_test.dart';
import 'package:jala_driver/main.dart';

void main() {
  testWidgets('App loads', (tester) async {
    await tester.pumpWidget(const JalaDriverApp());
    expect(find.textContaining('Jala Ride'), findsWidgets);
  });
}
