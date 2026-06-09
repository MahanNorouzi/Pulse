<?php

class Validator
{
    private array $errors = [];

    public function validate(array $data, array $rules): bool
    {
        foreach ($rules as $field => $ruleString) {
            $value = $data[$field] ?? null;
            foreach (explode('|', $ruleString) as $rule) {
                [$ruleName, $param] = array_pad(explode(':', $rule, 2), 2, null);
                $this->applyRule($field, $value, $ruleName, $param);
            }
        }
        return empty($this->errors);
    }

    private function applyRule(string $field, $value, string $rule, ?string $param): void
    {
        match ($rule) {
            'required' => (!isset($value) || $value === '') && $this->addError($field, "$field is required"),
            'min'      => (strlen((string)$value) < (int)$param)
                && $this->addError($field, "$field must be at least $param characters"),
            'max'      => (strlen((string)$value) > (int)$param)
                && $this->addError($field, "$field must be at most $param characters"),
            'email'    => (!filter_var($value, FILTER_VALIDATE_EMAIL))
                && $this->addError($field, "$field must be a valid email"),
            'numeric'  => (!is_numeric($value))
                && $this->addError($field, "$field must be numeric"),
            default    => null,
        };
    }

    private function addError(string $field, string $message): void
    {
        $this->errors[$field][] = $message;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
