export function bubbleSort(numbers: number[]): number[] {
    for (let i = 0; i < numbers.length - 1; i++) {
        for (let j = 0; j < numbers.length - 1; j++) {
            if (numbers[j]! > numbers[j + 1]!) {
                [numbers[j], numbers[j + 1]] = [numbers[j + 1]!, numbers[j]!];
            }
        }
    }
    return numbers;
}
