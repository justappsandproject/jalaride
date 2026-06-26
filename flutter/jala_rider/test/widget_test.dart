import 'package:flutter_test/flutter_test.dart';
import 'package:jala_rider/main.dart';

void main() {
  testWidgets('App loads', (tester) async {
    await tester.pumpWidget(const JalaRiderApp());
    expect(find.text('Jala Ride'), findsWidgets);
  });
}
